import { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { streamChat, stopChat, type CreatedFile } from '../../service/chat';
import { useMessages } from '../../service/queries';
import { useReportViewer } from '../../context/ReportViewerContext';
import { useTaskStore } from '../../store/taskStore';
import type { MessageAttachment } from '../../service/sessions';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'assistant' | 'system' | 'tool';
  content: string;
  isThinking?: boolean;
  thinkingContent?: string;
  attachments?: MessageAttachment[];
  activeProcess?: string;
}

interface ChatContainerProps {
  projectId?: string;
  sessionId?: string;
}

export const ChatContainer = ({ projectId, sessionId }: ChatContainerProps) => {
  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { openFile } = useReportViewer();
  const { upsert: upsertTask } = useTaskStore();

  // Fetch initial messages when sessionId changes
  const { data: initialMessages, isLoading: isFetchingMessages } = useMessages(projectId || null, sessionId || null);

  // Reset local state when switching sessions
  useEffect(() => {
    if (initialMessages) {
      setLocalMessages(initialMessages as Message[]);
    } else {
      setLocalMessages([]);
    }
  }, [initialMessages, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);

      if (sessionId) {
        stopChat(sessionId).catch(console.error);
      }
    }
  };

  const handleSend = async (content: string) => {
    if (!projectId || !sessionId) {
      console.warn("No project or session ID available to send message.");
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isThinking: true,
      thinkingContent: '',
      activeProcess: undefined,
    };

    setLocalMessages((prev) => [...prev, userMessage, initialAiMessage]);
    setIsStreaming(true);

    try {
      await streamChat(sessionId, content, {
        projectId,
        signal: abortController.signal,
        onDelta: (text) => {
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, content: msg.content + text } 
                : msg
            )
          );
        },
        onThinking: (text) => {
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, thinkingContent: (msg.thinkingContent || '') + text } 
                : msg
            )
          );
        },
        onToolStart: (name, id, args) => {
          console.log('Tool start:', name, id, args);
          const formattedName = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, activeProcess: `Running ${formattedName}...` } 
                : msg
            )
          );
        },
        onToolEnd: (id, summary) => {
          console.log('Tool end:', id, summary);
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, activeProcess: undefined } 
                : msg
            )
          );
        },
        onCitation: (index, url, title) => {
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, content: msg.content + `\n\n[${index}] [${title}](${url})` } 
                : msg
            )
          );
        },
        onFileCreated: (file: CreatedFile) => {
          // Append the file as a message attachment so the chip renders
          // immediately while the LLM is still streaming its short reply.
          const attachment: MessageAttachment = {
            id: file.file_id,
            filename: file.filename,
            original_filename: file.filename,
            mime_type: file.mime_type,
            size: 0,
            download_url: file.download_url,
          };
          setLocalMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    attachments: [...(msg.attachments || []), attachment],
                  }
                : msg
            )
          );
          // Auto-open Markdown reports in the side viewer (Gemini-style).
          if (file.kind === 'report_md' || file.mime_type === 'text/markdown') {
            openFile(attachment);
          }
        },
        onTitleUpdated: () => {
          queryClient.invalidateQueries({ queryKey: ['sessions', projectId] });
        },
        onTaskAccepted: ({ task_id, target }) => {
          // Immediately show a pending card in the right panel so the user
          // sees feedback before the first SSE progress event arrives.
          upsertTask({
            task_id,
            target,
            status: 'pending',
            percent: 0,
            phase: '',
            desc: 'Accepted, waiting to start...',
            kind: 'target_discovery',
            started_at: new Date().toISOString(),
          });
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, activeProcess: `Background task started: ${target || 'Target Discovery'}...` } 
                : msg
            )
          );
        },
        onDone: () => {
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, isThinking: false, activeProcess: undefined } 
                : msg
            )
          );
          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: ['messages', projectId ?? null, sessionId ?? null] });
        },
        onError: (error, isAbort) => {
          if (isAbort) {
            // User-initiated abort — rollback context to previous turn
            setLocalMessages((prev) =>
              prev.filter((msg) => msg.id !== aiMessageId && msg.id !== userMessage.id)
            );
            setIsStreaming(false);
            return;
          }
          console.error('Chat error:', error);
          // Phase 0: try to recover from backend — the message may have been
          // persisted via asyncio.shield even if the stream was cancelled.
          queryClient
            .invalidateQueries({ queryKey: ['messages', projectId ?? null, sessionId ?? null] })
            .then(() => {
              const stored = queryClient.getQueryData<Message[]>([
                'messages', projectId ?? null, sessionId ?? null,
              ]);
              const hasStoredAssistant = stored?.some(
                (m) => m.role === 'assistant' && m.id !== aiMessageId
              );
              if (!hasStoredAssistant) {
                setLocalMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: msg.content || 'An error occurred.', isThinking: false }
                      : msg
                  )
                );
              }
            });
          setIsStreaming(false);
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  if (isFetchingMessages) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column' }}>
        {(!projectId || !sessionId) ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            Select a project and session to start chatting.
          </Box>
        ) : localMessages.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            Start a conversation...
          </Box>
        ) : (
          localMessages.map((msg) => (
            <ChatMessage 
              key={msg.id} 
              role={msg.role === 'assistant' ? 'ai' : msg.role as any} 
              content={msg.content} 
              isThinking={msg.isThinking}
              thinkingContent={msg.thinkingContent}
              attachments={msg.attachments}
              activeProcess={msg.activeProcess}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      <ChatInput 
        onSend={handleSend} 
        onStop={handleStop}
        disabled={!projectId || !sessionId} 
        isStreaming={isStreaming} 
      />
    </Box>
  );
};
