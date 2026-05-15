import { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export const ChatInput = ({ onSend, onStop, disabled, isStreaming }: ChatInputProps) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && !disabled) {
        handleSend();
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Ask a question..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            bgcolor: 'background.default',
          }
        }}
      />
      <Box sx={{ pb: 0.5 }}>
        <IconButton 
          color="primary" 
          onClick={isStreaming ? onStop : handleSend} 
          disabled={(!input.trim() && !isStreaming) || disabled}
          sx={{
            bgcolor: isStreaming ? 'error.main' : 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: isStreaming ? 'error.dark' : 'primary.dark',
            },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            }
          }}
        >
          {isStreaming ? <StopIcon /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};
