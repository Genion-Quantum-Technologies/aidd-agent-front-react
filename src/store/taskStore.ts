import { create } from 'zustand';

const TERMINAL = new Set<string>(['succeeded', 'failed', 'cancelled']);

export interface TaskState {
  task_id: string;
  kind: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  percent: number;
  phase: string;
  desc: string;
  target: string;
  started_at: string;
  finished_at?: string | null;
  result?: {
    file_ids: string[];
    target: string;
    counts?: Record<string, number>;
    report_md_file_id?: string;
    report_md_filename?: string;
    report_file_id?: string;
    report_filename?: string;
  } | null;
  error?: string | null;
}

interface TaskStore {
  /** All tasks indexed by task_id. */
  activeTasks: Record<string, TaskState>;
  /** Upsert (create or update) a single task. */
  upsert: (task: TaskState) => void;
  /** Remove a task by id. */
  remove: (taskId: string) => void;
  /** Replace the entire task map (used for hydration on page load). */
  setAll: (tasks: TaskState[]) => void;
  /** Clear all tasks (used when switching sessions). */
  clear: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  activeTasks: {},

  upsert: (task) =>
    set((s) => {
      const cur = s.activeTasks[task.task_id];
      if (cur) {
        // Never overwrite a terminal task with a non-terminal one
        if (TERMINAL.has(cur.status) && !TERMINAL.has(task.status)) {
          console.warn('[taskStore] upsert: ignored non-terminal update on terminal task', {
            id: task.task_id.slice(0, 8), curStatus: cur.status, inStatus: task.status,
          });
          return s;
        }
        // Prevent percent regression for running tasks
        if (!TERMINAL.has(task.status) && task.percent < cur.percent) {
          console.warn('[taskStore] upsert: ignored percent regression', {
            id: task.task_id.slice(0, 8), cur: cur.percent, incoming: task.percent,
          });
          return s;
        }
      }
      console.debug('[taskStore] upsert', {
        id: task.task_id.slice(0, 8), status: task.status, percent: task.percent, phase: task.phase,
      });
      return { activeTasks: { ...s.activeTasks, [task.task_id]: task } };
    }),

  remove: (taskId) =>
    set((s) => {
      const { [taskId]: _, ...rest } = s.activeTasks;
      return { activeTasks: rest };
    }),

  setAll: (tasks) =>
    set((s) => {
      console.info('[taskStore] setAll (hydration)', tasks.map(
        (t) => ({ id: t.task_id.slice(0, 8), status: t.status, percent: t.percent }),
      ));
      const merged: Record<string, TaskState> = {};
      for (const task of tasks) {
        const cur = s.activeTasks[task.task_id];
        // Keep existing if it has higher progress (SSE already ahead of HTTP snapshot)
        if (cur && !TERMINAL.has(task.status) && task.percent < cur.percent) {
          console.warn('[taskStore] setAll: kept higher percent from store', {
            id: task.task_id.slice(0, 8), store: cur.percent, incoming: task.percent,
          });
          merged[task.task_id] = cur;
        } else {
          merged[task.task_id] = task;
        }
      }
      return { activeTasks: merged };
    }),

  clear: () => set({ activeTasks: {} }),
}));
