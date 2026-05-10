import { Box } from '@mui/material';
import { IconNav } from './IconNav';
import { TaskManager } from './TaskManager';
import { RightSection } from './RightSection';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <IconNav />
      <TaskManager />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {children}
      </Box>
      <RightSection />
    </Box>
  );
};
