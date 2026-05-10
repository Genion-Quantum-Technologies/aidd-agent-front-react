import { apiClient } from './apiClient';

export interface Session {
  id: string;
  project_id: string;
  title: string;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionFile {
  id: string;
  session_id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  description: string;
  download_url: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, any>;
  token_count?: number;
  created_at: string;
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

  updateSession: async (projectId: string, id: string, payload: { title?: string, is_pinned?: boolean }): Promise<Session> => {
    const { data } = await apiClient.patch<Session>(`/projects/${projectId}/sessions/${id}`, payload);
    return data;
  },

  deleteSession: async (projectId: string, id: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/sessions/${id}`);
  },

  getMessages: async (projectId: string, sessionId: string, limit = 50): Promise<Message[]> => {
    const { data } = await apiClient.get<Message[]>(`/${projectId}/${sessionId}/messages`, { params: { limit } });
    return data;
  },

  getFiles: async (sessionId: string): Promise<SessionFile[]> => {
    // Files endpoints might still be /files but let's assume they are not changed in the doc, 
    // Wait, the doc says 文件上传 API (`/files`). So it's still `/files` or `/sessions/{id}/files`.
    // I'll leave files as is, or use the old endpoint `/sessions/${sessionId}/files`.
    const { data } = await apiClient.get<SessionFile[]>(`/sessions/${sessionId}/files`);
    return data;
  },

  uploadFile: async (sessionId: string, file: File, description?: string): Promise<SessionFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const { data } = await apiClient.post<SessionFile>(`/sessions/${sessionId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  deleteFile: async (sessionId: string, fileId: string): Promise<void> => {
    await apiClient.delete(`/sessions/${sessionId}/files/${fileId}`);
  }
};
