import { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider, IconButton, CircularProgress, Menu, MenuItem, ListItemIcon } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import ShareIcon from '@mui/icons-material/Share';
import { useSessions, useCreateSession, useDeleteSession, useUpdateSession } from '../../service/queries';
import { useNavigate, useParams } from 'react-router-dom';

export const TaskManager = () => {
  const navigate = useNavigate();
  const { projectId, sessionId } = useParams();

  const { data: sessions, isLoading } = useSessions(projectId);
  const createSession = useCreateSession(projectId);
  const updateSession = useUpdateSession(projectId);
  const deleteSession = useDeleteSession(projectId);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const open = Boolean(anchorEl);

  const handleCreate = () => {
    if (!projectId) return;
    createSession.mutate('New Chat', {
      onSuccess: (data) => {
        navigate(`/projects/${projectId}/sessions/${data.id}`);
      }
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, id: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSessionId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSessionId(null);
  };

  const handleRename = () => {
    handleMenuClose();
    if (!selectedSessionId || !projectId) return;
    const session = sessions?.find(s => s.id === selectedSessionId);
    const newTitle = prompt('Enter new session name:', session?.title);
    if (newTitle && newTitle.trim() !== '') {
      updateSession.mutate({ id: selectedSessionId, title: newTitle.trim() });
    }
  };

  const handleDelete = () => {
    handleMenuClose();
    if (!selectedSessionId || !projectId) return;
    if (confirm('Are you sure you want to delete this session?')) {
      deleteSession.mutate(selectedSessionId, {
        onSuccess: () => {
          if (sessionId === selectedSessionId) {
            navigate(`/projects/${projectId}`);
          }
        }
      });
    }
  };

  const handlePin = () => {
    handleMenuClose();
    if (!selectedSessionId || !projectId) return;
    const session = sessions?.find(s => s.id === selectedSessionId);
    if (session) {
      updateSession.mutate({ id: selectedSessionId, is_pinned: !session.is_pinned });
    }
  };

  const handleShare = () => {
    handleMenuClose();
    if (!selectedSessionId || !projectId) return;
    const url = `${window.location.origin}/projects/${projectId}/sessions/${selectedSessionId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  // Sort sessions: pinned first, then by updated_at descending
  const sortedSessions = sessions ? [...sessions].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  }) : [];

  return (
    <Box
      sx={{
        width: 260,
        height: '100vh',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Sessions</Typography>
        <IconButton size="small" onClick={handleCreate} disabled={!projectId || createSession.isPending}>
          <AddIcon />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {!projectId ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography variant="body2" color="text.secondary">Please select a project.</Typography>
          </Box>
        ) : isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List>
            {sortedSessions.map((session) => (
              <ListItem
                key={session.id}
                disablePadding
                secondaryAction={
                  <IconButton edge="end" size="small" onClick={(e) => handleMenuClick(e, session.id)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  '& .MuiListItemSecondaryAction-root': {
                    display: anchorEl && selectedSessionId === session.id ? 'block' : 'none',
                  },
                  '&:hover .MuiListItemSecondaryAction-root': {
                    display: 'block',
                  }
                }}
              >
                <ListItemButton
                  selected={sessionId === session.id}
                  onClick={() => navigate(`/projects/${projectId}/sessions/${session.id}`)}
                  sx={{ pr: 6 }} // Add padding to avoid text overlapping with icon
                >
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {session.is_pinned ? <PushPinIcon fontSize="small" color="primary" /> : <Box sx={{ width: 20 }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {session.title || 'Untitled Session'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleRename}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePin}>
          <ListItemIcon>
            {sessions?.find(s => s.id === selectedSessionId)?.is_pinned
              ? <PushPinOutlinedIcon fontSize="small" />
              : <PushPinIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {sessions?.find(s => s.id === selectedSessionId)?.is_pinned ? 'Unpin' : 'Pin'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
