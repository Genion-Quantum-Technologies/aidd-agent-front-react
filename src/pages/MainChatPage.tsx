import { AppLayout } from '../component/layout/AppLayout';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ChatContainer } from '../component/chat/ChatContainer';

const MainChatPage = () => {
  const { projectId, sessionId } = useParams();

  return (
    <AppLayout>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default', height: '100%' }}>
        <ChatContainer projectId={projectId} sessionId={sessionId} />
      </Box>
    </AppLayout>
  );
};

export default MainChatPage;
