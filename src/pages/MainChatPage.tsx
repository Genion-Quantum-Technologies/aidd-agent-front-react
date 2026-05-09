import { AppLayout } from '../component/layout/AppLayout';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

const MainChatPage = () => {
  const { projectId } = useParams();

  return (
    <AppLayout>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {projectId ? (
          <Box sx={{ flex: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Chat interface for {projectId} will go here.</Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Select or create a task to start chatting.</Typography>
          </Box>
        )}
      </Box>
    </AppLayout>
  );
};

export default MainChatPage;
