import { Box, Typography } from '@mui/material';

export const RightSection = () => {
  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
          To-dos
        </Typography>
        <Typography variant="body2" color="text.disabled">No tasks yet.</Typography>
      </Box>
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
          Results
        </Typography>
        <Typography variant="body2" color="text.disabled">No results yet.</Typography>
      </Box>
    </Box>
  );
};
