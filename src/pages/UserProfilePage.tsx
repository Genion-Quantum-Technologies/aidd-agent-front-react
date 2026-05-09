import { Box, Typography } from '@mui/material';
import { AppLayout } from '../component/layout/AppLayout';

const UserProfilePage = () => {
  return (
    <AppLayout>
      <Box sx={{ p: 4, flex: 1, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>User Profile</Typography>
        <Typography color="text.secondary">Profile settings go here.</Typography>
      </Box>
    </AppLayout>
  );
};

export default UserProfilePage;
