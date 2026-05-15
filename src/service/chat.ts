export interface ChatSSEEvent {
  event: string;
  data: any;
}

export interface CreatedFile {
  file_id: string;
  filename: string;
  mime_type: string;
  /** Tool-specific kind hint (e.g. "report_md", "report_json"). */
  kind?: string;
  /** Server-provided absolute or relative download URL. */
  download_url: string;
}

export interface TaskAcceptedInfo {
  task_id: string;
  target: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function streamChat(
  sessionId: string,
  content: string,
  options: {
    projectId?: string;
    planMode?: boolean;
    fileIds?: string[];
    onDelta: (text: string) => void;
    onThinking: (text: string) => void;
    onToolStart: (name: string, id: string, args: any) => void;
    onToolEnd: (id: string, summary: string) => void;
    onCitation: (index: number, url: string, title: string) => void;
    onFileCreated?: (file: CreatedFile) => void;
    onTitleUpdated?: (title: string) => void;
    onTaskAccepted?: (info: TaskAcceptedInfo) => void;
    onDone: (messageId: string) => void;
    onError: (error: string, isAbort?: boolean) => void;
    signal?: AbortSignal;
  }
) {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        project_id: options.projectId,
        content,
        plan_mode: options.planMode || false,
        file_ids: options.fileIds || [],
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      options.onError(err.detail || 'Request failed');
      return;
    }

    if (!response.body) {
      options.onError('No response body');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete part

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();

        if (payload === '[DONE]') return;

        try {
          const event: ChatSSEEvent = JSON.parse(payload);
          switch (event.event) {
            case 'content_delta':
              options.onDelta(event.data.delta);
              break;
            case 'thinking_delta':
              options.onThinking(event.data.delta);
              break;
            case 'tool_use_start':
              options.onToolStart(event.data.tool_name, event.data.tool_call_id, event.data.args);
              break;
            case 'tool_use_end': {
              const summary = event.data.result_summary ?? '';
              options.onToolEnd(event.data.tool_call_id, summary);
              // Detect accepted background tasks and notify caller.
              try {
                const parsed = JSON.parse(summary.replace(/\.\.\.$/,''));
                if (parsed.status === 'accepted' && parsed.task_id) {
                  options.onTaskAccepted?.({ task_id: parsed.task_id, target: parsed.target ?? '' });
                }
              } catch {
                // summary is truncated prose — not JSON, skip
              }
              break;
            }
            case 'citation':
              options.onCitation(event.data.index, event.data.url, event.data.title);
              break;
            case 'file_created':
              options.onFileCreated?.({
                file_id: event.data.file_id,
                filename: event.data.filename,
                mime_type: event.data.mime_type,
                kind: event.data.kind,
                download_url: event.data.download_url,
              });
              break;
            case 'session_title_updated':
              options.onTitleUpdated?.(event.data.title);
              break;
            case 'message_end':
              options.onDone(event.data.message_id);
              break;
            case 'error':
              options.onError(event.data.message);
              break;
          }
        } catch (e) {
          // Ignore parsing errors for partial chunks that shouldn't happen with \n\n split
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      options.onError('', true);  // signal abort (user-initiated)
    } else {
      options.onError(error.message || 'Stream error');
    }
  }
}

export async function stopChat(sessionId: string): Promise<void> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/chat/stop`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) {
    throw new Error('Failed to stop chat');
  }
}
