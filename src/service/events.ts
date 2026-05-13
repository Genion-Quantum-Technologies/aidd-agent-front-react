/**
 * Session event stream client.
 *
 * Subscribes to GET /projects/{projectId}/sessions/{sessionId}/events
 * using fetch + ReadableStream (same pattern as chat.ts) so that the
 * Authorization header is sent with every request.
 *
 * Usage:
 *   const controller = new AbortController();
 *   subscribeSessionEvents(sessionId, projectId, { onTaskProgress: ... }, controller.signal);
 *   // later:
 *   controller.abort();
 */

import type { TaskState } from '../store/taskStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface SessionEventHandlers {
  onTaskProgress?: (task: TaskState) => void;
  onTaskCompleted?: (task: TaskState) => void;
  onTaskFailed?: (task: TaskState) => void;
  onTaskCancelled?: (task: TaskState) => void;
  /** Called when the backend appends a new assistant message (resume_after_task). */
  onMessageAppended?: (messageId: string) => void;
}

/** Connect once and stream until the connection closes or signal fires. */
async function _connectOnce(
  sessionId: string,
  projectId: string,
  handlers: SessionEventHandlers,
  signal: AbortSignal,
): Promise<boolean> {
  const token = localStorage.getItem('token');

  console.info('[events] connecting', { session: sessionId.slice(0, 8), project: projectId.slice(0, 8) });

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE}/projects/${projectId}/sessions/${sessionId}/events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      }
    );
  } catch (err: any) {
    if (err?.name === 'AbortError') return false; // user aborted — stop retrying
    console.error('[events] fetch failed', err);
    return true; // network error — caller should retry
  }

  if (!response.ok || !response.body) {
    console.error('[events] bad response', response.status);
    // 4xx errors are permanent; 5xx / network errors should be retried
    return response.status >= 500;
  }

  console.info('[events] connected', { session: sessionId.slice(0, 8) });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        if (part.startsWith(':')) continue; // keep-alive comment

        const dataLine = part.split('\n').find((l) => l.startsWith('data: '));
        if (!dataLine) continue;

        const rawData = dataLine.slice(6).trim();
        if (!rawData) continue;

        let event: { type: string; task?: any; session_id?: string; message_id?: string };
        try {
          event = JSON.parse(rawData);
        } catch {
          continue;
        }

        const task: TaskState | undefined = event.task;
        console.debug('[events] event', event.type,
          task ? { id: task.task_id.slice(0, 8), status: task.status, percent: task.percent, phase: task.phase } : {});
        switch (event.type) {
          case 'task_progress':
            if (task) handlers.onTaskProgress?.(task);
            break;
          case 'task_completed':
            if (task) handlers.onTaskCompleted?.(task);
            break;
          case 'task_failed':
            if (task) handlers.onTaskFailed?.(task);
            break;
          case 'task_cancelled':
            if (task) handlers.onTaskCancelled?.(task);
            break;
          case 'message_appended':
            if (event.message_id) handlers.onMessageAppended?.(event.message_id);
            break;
          default:
            break;
        }
      }
    }
    // Stream ended cleanly — retry to keep the subscription alive.
    console.info('[events] stream ended cleanly, will retry', { session: sessionId.slice(0, 8) });
    return true;
  } catch (err: any) {
    if (err?.name === 'AbortError') return false;
    console.error('[events] stream read error', err);
    return true; // retry on network errors
  }
}

/** Maximum back-off delay between reconnect attempts (ms). */
const MAX_BACKOFF_MS = 30_000;

/**
 * Subscribe to session events with automatic exponential-backoff reconnection.
 *
 * The returned Promise resolves when `signal` is aborted (i.e. user navigates
 * away / changes session).  It never rejects.
 */
export async function subscribeSessionEvents(
  sessionId: string,
  projectId: string,
  handlers: SessionEventHandlers,
  signal: AbortSignal,
): Promise<void> {
  let attempt = 0;

  while (!signal.aborted) {
    const shouldRetry = await _connectOnce(sessionId, projectId, handlers, signal);
    if (!shouldRetry || signal.aborted) break;

    // Exponential back-off: 1 s, 2 s, 4 s … capped at MAX_BACKOFF_MS
    const delay = Math.min(1_000 * 2 ** attempt, MAX_BACKOFF_MS);
    attempt += 1;
    console.info(`[events] reconnecting in ${delay}ms (attempt ${attempt})`, { session: sessionId.slice(0, 8) });

    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, delay);
      signal.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true });
    });
  }
}
