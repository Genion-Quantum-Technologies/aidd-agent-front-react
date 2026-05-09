import { Box, IconButton, Avatar, Tooltip } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

export const IconNav = () => {
  const { logout, user } = useAuth();

  return (
    <Box
      sx={{
        width: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        justifyContent: 'space-between',
        height: '100vh',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Tooltip title="Projects" placement="right">
          <IconButton color="primary">
            <FolderIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Tooltip title="Help" placement="right">
          <IconButton>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings" placement="right">
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Logout" placement="right">
          <IconButton onClick={() => {
            logout();
          }}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
        <Avatar sx={{ mt: 1, width: 32, height: 32, bgcolor: 'primary.main', color: 'background.default' }}>
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </Avatar>
      </Box>
    </Box>
  );
};
