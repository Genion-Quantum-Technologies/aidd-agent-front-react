import { Box, Typography, Paper } from '@mui/material';
import { AppLayout } from '../component/layout/AppLayout';

const HelpPage = () => {
  return (
    <AppLayout>
      <Box sx={{ p: 4, flex: 1, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 4, alignSelf: 'flex-start' }}>Help & Support</Typography>

        <Paper elevation={1} sx={{ p: 4, width: '100%', maxWidth: 800, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>How can we help you?</Typography>
          <Typography color="text.secondary">
            This is the help page. Documentation and FAQs will be added here soon.
          </Typography>
        </Paper>
      </Box>
    </AppLayout>
  );
};

export default HelpPage;
