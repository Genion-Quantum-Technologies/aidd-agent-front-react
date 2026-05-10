import { useState } from 'react';
import { Box, IconButton, Avatar, Tooltip, Menu, MenuItem, ListItemText, CircularProgress, Divider, ListItemIcon } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects, useCreateProject } from '../../service/queries';

export const IconNav = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProjectsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectProject = (id: string) => {
    navigate(`/projects/${id}`);
    handleClose();
  };

  const handleCreateProject = () => {
    handleClose();
    const name = prompt('Enter new project name:');
    if (name && name.trim() !== '') {
      createProject.mutate(name.trim(), {
        onSuccess: (data) => {
          navigate(`/projects/${data.id}`);
        }
      });
    }
  };

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
          <IconButton
            color={open || projectId ? "primary" : "default"}
            onClick={handleProjectsClick}
          >
            <FolderIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem onClick={handleCreateProject} disabled={createProject.isPending}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Create new project" />
          </MenuItem>
          <Divider />

          {isLoading ? (
            <MenuItem disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Loading...
            </MenuItem>
          ) : projects && projects.length > 0 ? (
            projects.map((project) => (
              <MenuItem
                key={project.id}
                selected={project.id === projectId}
                onClick={() => handleSelectProject(project.id)}
              >
                <ListItemText primary={project.name} />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No projects found</MenuItem>
          )}
        </Menu>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Tooltip title="Help" placement="right">
          <IconButton onClick={() => navigate('/help')}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings" placement="right">
          <IconButton>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Logout" placement="right">
          <IconButton onClick={() => logout()}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Profile" placement="right">
          <IconButton onClick={() => navigate('/profile')} sx={{ p: 0, mt: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'background.default' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
