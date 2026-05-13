import { apiClient } from './apiClient';

export interface Session {
  id: string;
  project_id: string;
  title: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionFile {
  id: string;
  project_id: string;
  session_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  description: string | null;
  s3_key: string;
  download_url: string;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  download_url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, any>;
  token_count?: number;
  created_at: string;
  file_ids?: string[];
  attachments?: MessageAttachment[];
}

export const sessionService = {
  getSessions: async (projectId: string): Promise<Session[]> => {
    const { data } = await apiClient.get<Session[]>(`/projects/${projectId}/sessions`);
    return data;
  },

  createSession: async (projectId: string, title?: string): Promise<Session> => {
    const { data } = await apiClient.post<Session>(`/projects/${projectId}/sessions`, { title });
    return data;
  },

  updateSession: async (
    projectId: string,
    id: string,
    payload: { title?: string; is_pinned?: boolean }
  ): Promise<Session> => {
    const { data } = await apiClient.patch<Session>(
      `/projects/${projectId}/sessions/${id}`,
      payload
    );
    return data;
  },

  deleteSession: async (projectId: string, id: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/sessions/${id}`);
  },

  getMessages: async (
    projectId: string,
    sessionId: string,
    limit = 50
  ): Promise<Message[]> => {
    const { data } = await apiClient.get<Message[]>(
      `/projects/${projectId}/sessions/${sessionId}/messages`,
      { params: { limit } }
    );
    return data;
  },

  getFiles: async (projectId: string, sessionId: string): Promise<SessionFile[]> => {
    const { data } = await apiClient.get<SessionFile[]>(
      `/projects/${projectId}/sessions/${sessionId}/files`
    );
    return data;
  },

  uploadFile: async (
    projectId: string,
    sessionId: string,
    file: File,
    description?: string
  ): Promise<SessionFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const { data } = await apiClient.post<SessionFile>(
      `/projects/${projectId}/sessions/${sessionId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  deleteFile: async (
    projectId: string,
    sessionId: string,
    fileId: string
  ): Promise<void> => {
    await apiClient.delete(
      `/projects/${projectId}/sessions/${sessionId}/files/${fileId}`
    );
  },

  getActiveTasks: async (
    projectId: string,
    sessionId: string,
  ): Promise<import('../store/taskStore').TaskState[]> => {
    const { data } = await apiClient.get<{ tasks: import('../store/taskStore').TaskState[] }>(
      `/projects/${projectId}/sessions/${sessionId}/active-tasks`
    );
    return data.tasks;
  },
};
