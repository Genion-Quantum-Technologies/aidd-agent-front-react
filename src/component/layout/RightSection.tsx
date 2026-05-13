import { Box, Typography, LinearProgress, Chip, IconButton, Tooltip } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import DescriptionIcon from '@mui/icons-material/Description';
import { useTaskStore, type TaskState } from '../../store/taskStore';
import { apiClient } from '../../service/apiClient';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface TaskProgressCardProps {
  task: TaskState;
}

const TaskProgressCard = ({ task }: TaskProgressCardProps) => {
  const handleCancel = async () => {
    try {
      await apiClient.delete(`/tasks/${task.task_id}`);
    } catch (e) {
      console.error('Failed to cancel task', e);
    }
  };

  const isPending = task.status === 'pending';
  const isFailed = task.status === 'failed';
  const isCancelled = task.status === 'cancelled';

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: isFailed || isCancelled ? 'error.light' : 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" noWrap sx={{ fontWeight: 'bold', flex: 1 }}>
          {task.target || task.kind}
        </Typography>
        {!isFailed && !isCancelled && (
          <Tooltip title="Cancel">
            <IconButton size="small" onClick={handleCancel} sx={{ ml: 0.5, p: 0.25 }}>
              <CancelIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {isFailed
          ? `Failed: ${task.error || 'unknown error'}`
          : isCancelled
          ? 'Cancelled'
          : task.desc}
      </Typography>
      <LinearProgress
        variant={isPending ? 'indeterminate' : 'determinate'}
        value={task.percent}
        color={isFailed || isCancelled ? 'error' : 'primary'}
        sx={{ borderRadius: 1, height: 4 }}
      />
      {!isPending && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block', textAlign: 'right' }}>
          {task.percent}%
        </Typography>
      )}
    </Box>
  );
};

interface TaskResultChipsProps {
  task: TaskState;
}

const TaskResultChips = ({ task }: TaskResultChipsProps) => {
  if (!task.result?.file_ids?.length) return null;

  const mdId = task.result.report_md_file_id;
  const mdName = task.result.report_md_filename || `${task.target}_report.md`;

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {task.target}
      </Typography>
      {mdId && (
        <Chip
          size="small"
          icon={<DescriptionIcon />}
          label={mdName}
          onClick={() => {
            // Let ChatContainer's file attachment chip handling open the viewer.
            // Here we just provide a visual indicator.
          }}
          sx={{ fontSize: '0.65rem', maxWidth: '100%' }}
        />
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export const RightSection = () => {
  const { activeTasks } = useTaskStore();
  const tasks = Object.values(activeTasks);
  const inProgress = tasks.filter((t) => t.status === 'running' || t.status === 'pending');
  const terminal = tasks.filter(
    (t) => t.status === 'failed' || t.status === 'cancelled' || t.status === 'succeeded'
  );
  const succeeded = tasks.filter((t) => t.status === 'succeeded');

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* To-dos: in-progress tasks */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
          To-dos
        </Typography>
        {inProgress.length === 0 && terminal.length === 0 ? (
          <Typography variant="body2" color="text.disabled">No tasks yet.</Typography>
        ) : inProgress.length === 0 ? null : (
          inProgress.map((task) => <TaskProgressCard key={task.task_id} task={task} />)
        )}
        {/* Show failed/cancelled tasks in the to-dos panel too */}
        {terminal.filter((t) => t.status !== 'succeeded').map((task) => (
          <TaskProgressCard key={task.task_id} task={task} />
        ))}
      </Box>

      {/* Results: completed task reports */}
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
          Results
        </Typography>
        {succeeded.length === 0 ? (
          <Typography variant="body2" color="text.disabled">No results yet.</Typography>
        ) : (
          succeeded.map((task) => <TaskResultChips key={task.task_id} task={task} />)
        )}
      </Box>
    </Box>
  );
};

