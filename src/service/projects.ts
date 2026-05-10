import { apiClient } from './apiClient';

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>('/projects');
    return data;
  },

  getProject: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<Project>(`/projects/${id}`);
    return data;
  },

  createProject: async (name: string, description?: string): Promise<Project> => {
    const { data } = await apiClient.post<Project>('/projects', { name, description });
    return data;
  },

  updateProject: async (id: string, name?: string, description?: string): Promise<Project> => {
    const { data } = await apiClient.patch<Project>(`/projects/${id}`, { name, description });
    return data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  }
};
