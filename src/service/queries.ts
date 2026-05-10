import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from './projects';
import { sessionService } from './sessions';

// --- Projects ---
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => projectService.createProject(name),
    onSuccess: (newProject) => {
      queryClient.setQueryData(['projects'], (old: any) => {
        return old ? [...old, newProject] : [newProject];
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// --- Sessions ---
export const useSessions = (projectId?: string) => {
  return useQuery({
    queryKey: ['sessions', projectId],
    queryFn: () => sessionService.getSessions(projectId!),
    enabled: !!projectId,
  });
};

export const useCreateSession = (projectId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => sessionService.createSession(projectId!, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', projectId] });
    },
  });
};

export const useUpdateSession = (projectId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, is_pinned }: { id: string; title?: string; is_pinned?: boolean }) =>
      sessionService.updateSession(projectId!, id, { title, is_pinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', projectId] });
    },
  });
};

export const useDeleteSession = (projectId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionService.deleteSession(projectId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', projectId] });
    },
  });
};

export const useMessages = (projectId: string | null, sessionId: string | null) => {
  return useQuery({
    queryKey: ['messages', projectId, sessionId],
    queryFn: () => sessionService.getMessages(projectId!, sessionId!),
    enabled: !!projectId && !!sessionId,
  });
};

export const useFiles = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['files', sessionId],
    queryFn: () => sessionService.getFiles(sessionId!),
    enabled: !!sessionId,
  });
};
