// Persistence layer. Everything is async (Promise-based) on purpose: today
// it's backed by localStorage, but the same shape can later be swapped for
// a Supabase-backed implementation without touching main.js.

const TASKS_KEY = "ritmo.tasks.v1";
const SETTINGS_KEY = "ritmo.settings.v1";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export const TaskStore = {
  async list() {
    return readTasks();
  },

  async add({ date, hour, title }) {
    const tasks = readTasks();
    const task = {
      id: uid(),
      date,
      hour,
      title: title.trim(),
      status: "pending", // pending | done | skipped
      reason: "",
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    writeTasks(tasks);
    return task;
  },

  async update(id, patch) {
    const tasks = readTasks();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...patch };
    writeTasks(tasks);
    return tasks[idx];
  },

  async remove(id) {
    const tasks = readTasks();
    const removed = tasks.find((t) => t.id === id) || null;
    writeTasks(tasks.filter((t) => t.id !== id));
    return removed;
  },

  async restore(task) {
    const tasks = readTasks();
    tasks.push(task);
    writeTasks(tasks);
    return task;
  },
};

export const SettingsStore = {
  get() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw
        ? { ...defaultSettings(), ...JSON.parse(raw) }
        : defaultSettings();
    } catch {
      return defaultSettings();
    }
  },
  set(patch) {
    const next = { ...this.get(), ...patch };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    return next;
  },
};

function defaultSettings() {
  return {
    theme: "system", // system | light | dark
    reminderEnabled: false,
    reminderTime: "20:00",
    lastAlertDate: null,
  };
}
