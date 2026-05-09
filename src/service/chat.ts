export interface ChatSSEEvent {
  event: string;
  data: any;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function streamChat(
  sessionId: string,
  content: string,
  options: {
    planMode?: boolean;
    fileIds?: string[];
    onDelta: (text: string) => void;
    onThinking: (text: string) => void;
    onToolStart: (name: string, id: string, args: any) => void;
    onToolEnd: (id: string, summary: string) => void;
    onCitation: (index: number, url: string, title: string) => void;
    onDone: (messageId: string) => void;
    onError: (error: string) => void;
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
            case 'tool_use_end':
              options.onToolEnd(event.data.tool_call_id, event.data.result_summary);
              break;
            case 'citation':
              options.onCitation(event.data.index, event.data.url, event.data.title);
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
      console.log('Stream aborted');
    } else {
      options.onError(error.message || 'Stream error');
    }
  }
}
