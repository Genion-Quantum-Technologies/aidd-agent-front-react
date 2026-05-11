import { Box, Avatar, Paper, Stack } from '@mui/material';
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
}

export const ChatMessage = ({ role, content, isThinking, thinkingContent, attachments }: ChatMessageProps) => {
  const isAi = role === 'ai';

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: isAi ? 'row' : 'row-reverse' }}>
      <Avatar sx={{ bgcolor: isAi ? 'primary.main' : 'secondary.main', width: 40, height: 40 }}>
        {isAi ? <SmartToyIcon /> : <PersonIcon />}
      </Avatar>
      <Box sx={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 1 }}>
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
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            isThinking ? <Box sx={{ fontStyle: 'italic', opacity: 0.7, py: 1 }}>Thinking...</Box> : null
          )}
        </Paper>
        {attachments && attachments.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
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
