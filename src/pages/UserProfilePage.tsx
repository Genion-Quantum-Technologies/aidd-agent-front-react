import { Box, Typography, Paper, Avatar } from '@mui/material';
import { AppLayout } from '../component/layout/AppLayout';
import { useAuth } from '../context/AuthContext';

const UserProfilePage = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <Box sx={{ p: 4, flex: 1, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 4, alignSelf: 'flex-start' }}>User Profile</Typography>

        <Paper elevation={1} sx={{ p: 4, width: '100%', maxWidth: 600, display: 'flex', alignItems: 'center', gap: 4, borderRadius: 3 }}>
          <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: '3rem' }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{user?.username || 'Unknown User'}</Typography>
          </Box>
        </Paper>
      </Box>
    </AppLayout>
  );
};

export default UserProfilePage;
