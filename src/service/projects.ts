import { apiClient } from './apiClient';

export interface Session {
  id: string;
  title: string;
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
  getSessions: async (): Promise<Session[]> => {
    const { data } = await apiClient.get<Session[]>('/sessions');
    return data;
  },
  
  createSession: async (title?: string): Promise<Session> => {
    const { data } = await apiClient.post<Session>('/sessions', { title });
    return data;
  },

  updateSession: async (id: string, title: string): Promise<Session> => {
    const { data } = await apiClient.patch<Session>(`/sessions/${id}`, { title });
    return data;
  },

  deleteSession: async (id: string): Promise<void> => {
    await apiClient.delete(`/sessions/${id}`);
  },

  getMessages: async (sessionId: string, limit = 50): Promise<Message[]> => {
    const { data } = await apiClient.get<Message[]>(`/sessions/${sessionId}/messages`, { params: { limit } });
    return data;
  },

  getFiles: async (sessionId: string): Promise<SessionFile[]> => {
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
