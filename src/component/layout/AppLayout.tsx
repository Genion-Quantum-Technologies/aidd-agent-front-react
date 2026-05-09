import { Box } from '@mui/material';
import { IconNav } from './IconNav';
import { SideMenu } from './SideMenu';
import { RightSection } from './RightSection';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <IconNav />
      <SideMenu />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {children}
      </Box>
      <RightSection />
    </Box>
  );
};
