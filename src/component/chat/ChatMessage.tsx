import { Box, Avatar, Paper, Stack, CircularProgress } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ReactMarkdown from 'react-markdown';
import type { MessageAttachment } from '../../service/sessions';
import { ReportAttachment } from './ReportAttachment';

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
  isThinking?: boolean;
  thinkingContent?: string;
  attachments?: MessageAttachment[];
  activeProcess?: string;
}

export const ChatMessage = ({ role, content, isThinking, thinkingContent, attachments, activeProcess }: ChatMessageProps) => {
  const isAi = role === 'ai';
  // Strip any <thought>...</thought> blocks that leaked from reasoning models
  // before rendering — acts as a safety net for already-persisted messages.
  const displayContent = content.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: isAi ? 'row' : 'row-reverse' }}>
      <Box sx={{ position: 'relative', width: 40, height: 40 }}>
        <Avatar sx={{ bgcolor: isAi ? 'primary.main' : 'secondary.main', width: 40, height: 40 }}>
          {isAi ? <SmartToyIcon /> : <PersonIcon />}
        </Avatar>
        {isAi && isThinking && (
          <CircularProgress 
            size={48} 
            thickness={2}
            sx={{ 
              position: 'absolute', 
              top: -4, 
              left: -4, 
              zIndex: 1,
              color: 'primary.light'
            }} 
          />
        )}
      </Box>
      <Box sx={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {isAi && activeProcess && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontSize: '0.85rem', px: 1, pt: 0.5 }}>
            <CircularProgress size={12} color="inherit" />
            <Box component="span" sx={{ fontStyle: 'italic', opacity: 0.9 }}>{activeProcess}</Box>
          </Box>
        )}
        <Paper
          elevation={1}
          sx={{
            px: 2,
            py: 1,
            borderRadius: 3,
            bgcolor: isAi ? 'background.paper' : 'primary.dark',
            color: isAi ? 'text.primary' : 'primary.contrastText',
            borderTopLeftRadius: isAi ? 0 : undefined,
            borderTopRightRadius: !isAi ? 0 : undefined,
            '& p': { margin: '0.5em 0' },
            '& pre': { 
              bgcolor: 'rgba(0, 0, 0, 0.1)', 
              p: 1, 
              borderRadius: 1, 
              overflowX: 'auto',
              color: isAi ? 'inherit' : 'inherit'
            },
            '& code': { 
              fontFamily: 'monospace',
              bgcolor: 'rgba(0, 0, 0, 0.1)',
              px: 0.5,
              borderRadius: 0.5
            }
          }}
        >
          {displayContent ? (
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          ) : (
            isThinking ? <Box sx={{ fontStyle: 'italic', opacity: 0.7, py: 1 }}>Thinking...</Box> : null
          )}
        </Paper>
        {attachments && attachments.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 1 }}>
            {attachments.map((f) => (
              <ReportAttachment key={f.id} file={f} />
            ))}
          </Stack>
        )}
        {isThinking && thinkingContent && (
          <Box sx={{ 
            fontSize: '0.75rem', 
            color: 'text.secondary', 
            fontStyle: 'italic', 
            pl: 1,
            borderLeft: '2px solid',
            borderColor: 'divider',
            ml: 1,
            maxHeight: '100px',
            overflowY: 'auto'
          }}>
            {thinkingContent}
          </Box>
        )}
      </Box>
    </Box>
  );
};
