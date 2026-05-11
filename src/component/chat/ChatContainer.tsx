import { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { streamChat } from '../../service/chat';
import { useMessages } from '../../service/queries';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'assistant' | 'system' | 'tool';
  content: string;
  isThinking?: boolean;
  thinkingContent?: string;
}

interface ChatContainerProps {
  projectId?: string;
  sessionId?: string;
}

export const ChatContainer = ({ projectId, sessionId }: ChatContainerProps) => {
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (content: string) => {
    if (!projectId || !sessionId) {
      console.warn("No project or session ID available to send message.");
      return;
    }

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
    };

    setLocalMessages((prev) => [...prev, userMessage, initialAiMessage]);
    setIsStreaming(true);

    try {
      await streamChat(sessionId, content, {
        projectId,
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
        },
        onToolEnd: (id, summary) => {
          console.log('Tool end:', id, summary);
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
        onDone: () => {
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, isThinking: false } 
                : msg
            )
          );
          setIsStreaming(false);
        },
        onError: (error) => {
          console.error('Chat error:', error);
          setLocalMessages((prev) => 
            prev.map((msg) => 
              msg.id === aiMessageId 
                ? { ...msg, content: msg.content || 'An error occurred.', isThinking: false } 
                : msg
            )
          );
          setIsStreaming(false);
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
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
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      <ChatInput onSend={handleSend} disabled={isStreaming || !projectId || !sessionId} isLoading={isStreaming} />
    </Box>
  );
};
