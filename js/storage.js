import { supabase } from "./supabaseClient.js";

// Persistence layer for tasks, backed by Supabase (table `tasks`, see
// supabase/schema.sql). Settings (theme, reminder) stay in localStorage
// since those are per-device preferences, not user data to sync.

const SETTINGS_KEY = "ritmo.settings.v1";

function rowToTask(row) {
  return {
    id: row.id,
    date: row.date,
    hour: row.hour,
    title: row.title,
    status: row.status,
    reason: row.reason || "",
    createdAt: row.created_at,
  };
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("No hay sesión activa.");
  return data.user.id;
}

export const TaskStore = {
  async list() {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .order("hour", { ascending: true });
    if (error) throw error;
    return data.map(rowToTask);
  },

  async add({ date, hour, title }) {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: userId, date, hour, title: title.trim(), status: "pending", reason: "" })
      .select()
      .single();
    if (error) throw error;
    return rowToTask(data);
  },

  async update(id, patch) {
    const row = {};
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.reason !== undefined) row.reason = patch.reason;
    const { data, error } = await supabase.from("tasks").update(row).eq("id", id).select().single();
    if (error) throw error;
    return rowToTask(data);
  },

  async remove(id) {
    const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
    if (error) throw error;
    const { error: delError } = await supabase.from("tasks").delete().eq("id", id);
    if (delError) throw delError;
    return rowToTask(data);
  },

  async restore(task) {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        date: task.date,
        hour: task.hour,
        title: task.title,
        status: task.status,
        reason: task.reason,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToTask(data);
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
