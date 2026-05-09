import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from './projects';

export const useSessions = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: sessionService.getSessions,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => sessionService.createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useMessages = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => sessionService.getMessages(sessionId!),
    enabled: !!sessionId,
  });
};

export const useFiles = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['files', sessionId],
    queryFn: () => sessionService.getFiles(sessionId!),
    enabled: !!sessionId,
  });
};
