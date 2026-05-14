import { useEffect, useRef } from 'react';
import { AppLayout } from '../component/layout/AppLayout';
import { Box } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChatContainer } from '../component/chat/ChatContainer';
import { useActiveTasks } from '../service/queries';
import { subscribeSessionEvents } from '../service/events';
import { useTaskStore } from '../store/taskStore';
import { projectService } from '../service/projects';
import { sessionService } from '../service/sessions';

const MainChatPage = () => {
  const { projectId, sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAll, upsert, clear } = useTaskStore();

  // Auto-select the most recent project (or create "Default") when no projectId is in the URL.
  useEffect(() => {
    if (projectId) return;
    let cancelled = false;
    projectService.getProjects().then(projects => {
      if (cancelled) return;
      if (projects.length > 0) {
        const latest = [...projects].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];
        navigate(`/projects/${latest.id}`, { replace: true });
      } else {
        return projectService.createProject('Default').then(newProject => {
          if (cancelled) return;
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          navigate(`/projects/${newProject.id}`, { replace: true });
        });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId, navigate, queryClient]);

  // Auto-select the most recent session (or create "New Chat") when projectId is set but no sessionId.
  useEffect(() => {
    if (!projectId || sessionId) return;
    let cancelled = false;
    sessionService.getSessions(projectId).then(sessions => {
      if (cancelled) return;
      if (sessions.length > 0) {
        const latest = [...sessions].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];
        navigate(`/projects/${projectId}/sessions/${latest.id}`, { replace: true });
      } else {
        return sessionService.createSession(projectId, 'New Chat').then(newSession => {
          if (cancelled) return;
          queryClient.invalidateQueries({ queryKey: ['sessions', projectId] });
          navigate(`/projects/${projectId}/sessions/${newSession.id}`, { replace: true });
        });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId, sessionId, navigate, queryClient]);

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
