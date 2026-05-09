import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider, IconButton, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSessions, useCreateSession } from '../../service/queries';
import { useNavigate, useParams } from 'react-router-dom';

export const SideMenu = () => {
  const { data: sessions, isLoading } = useSessions();
  const createSession = useCreateSession();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const handleCreate = () => {
    createSession.mutate('New Chat', {
      onSuccess: (data) => {
        navigate(`/projects/${data.id}`);
      }
    });
  };

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
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Tasks</Typography>
        <IconButton size="small" onClick={handleCreate} disabled={createSession.isPending}>
          <AddIcon />
        </IconButton>
      </Box>
      <Divider />
      
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List>
            {sessions?.map((session) => (
              <ListItem key={session.id} disablePadding>
                <ListItemButton 
                  selected={projectId === session.id}
                  onClick={() => navigate(`/projects/${session.id}`)}
                >
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
    </Box>
  );
};
