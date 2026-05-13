import { useEffect, useRef } from 'react';
import { AppLayout } from '../component/layout/AppLayout';
import { Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChatContainer } from '../component/chat/ChatContainer';
import { useActiveTasks } from '../service/queries';
import { subscribeSessionEvents } from '../service/events';
import { useTaskStore } from '../store/taskStore';

const MainChatPage = () => {
  const { projectId, sessionId } = useParams();
  const queryClient = useQueryClient();
  const { setAll, upsert, clear } = useTaskStore();

  // Hydrate task list from backend on session load / switch.
  const { data: activeTasks } = useActiveTasks(projectId, sessionId);
  useEffect(() => {
    if (activeTasks) {
      console.info('[MainChatPage] hydrating from active-tasks', {
        session: sessionId?.slice(0, 8),
        tasks: activeTasks.map((t) => ({ id: t.task_id.slice(0, 8), status: t.status, percent: t.percent })),
      });
      setAll(activeTasks);
    } else {
      clear();
    }
  }, [activeTasks, setAll, clear]);

  // Subscribe to the session events SSE channel.
  // Use a ref to keep the AbortController stable across renders.
  const eventsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!sessionId || !projectId) return;

    // Abort previous subscription (if any).
    eventsAbortRef.current?.abort();
    const controller = new AbortController();
    eventsAbortRef.current = controller;

    clear(); // reset stale task state when switching sessions

    subscribeSessionEvents(
      sessionId,
      projectId,
      {
        onTaskProgress:  (task) => upsert(task),
        onTaskCompleted: (task) => upsert(task),
        onTaskFailed:    (task) => upsert(task),
        onTaskCancelled: (task) => upsert(task),
        onMessageAppended: () => {
          // A new assistant message was persisted by resume_after_task.
          queryClient.invalidateQueries({
            queryKey: ['messages', projectId, sessionId],
          });
        },
      },
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [sessionId, projectId, queryClient, upsert, clear]);

  return (
    <AppLayout>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default', height: '100%' }}>
        <ChatContainer projectId={projectId} sessionId={sessionId} />
      </Box>
    </AppLayout>
  );
};

export default MainChatPage;
