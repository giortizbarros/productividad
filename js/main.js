import { TaskStore, SettingsStore } from "./storage.js";
import {
  toISODate,
  fromISODate,
  startOfWeek,
  addDays,
  getWeekDates,
  isSameDate,
  weekdayShort,
  formatWeekRange,
  formatDayTitle,
  hourLabel,
} from "./dates.js";

// ---------- State ----------
let tasks = [];
let weekStart = startOfWeek(new Date());
let selectedDate = new Date();
let settings = SettingsStore.get();
let pendingReasonEditorId = null; // task id currently showing its reason textarea
let undoBuffer = null;
let undoTimer = null;

// ---------- DOM refs ----------
const el = (id) => document.getElementById(id);
const weekRangeEl = el("weekRange");
const weekAvgEl = el("weekAvg");
const dayTabsEl = el("dayTabs");
const dayTitleEl = el("dayTitle");
const dayFractionEl = el("dayFraction");
const dayPercentEl = el("dayPercent");
const ringProgressEl = el("dayRingProgress");
const alertBannerEl = el("alertBanner");
const alertTextEl = el("alertText");
const quickAddForm = el("quickAddForm");
const quickAddTitle = el("quickAddTitle");
const quickAddHour = el("quickAddHour");
const hoursListEl = el("hoursList");
const toastEl = el("toast");
const toastTextEl = el("toastText");
const settingsPanel = el("settingsPanel");
const overlayEl = el("overlay");
const reminderModal = el("reminderModal");

const RING_CIRCUMFERENCE = 2 * Math.PI * 30;

// ---------- Init ----------
async function init() {
  applyTheme();
  populateHourSelect();
  tasks = await TaskStore.list();

  renderAll();
  bindEvents();
  restoreSettingsUI();

  setInterval(checkReminder, 30_000);
  setInterval(() => renderAll({ keepScroll: true }), 60_000);
}

function renderAll() {
  renderWeekNav();
  renderDayTabs();
  renderDayView();
}

// ---------- Week nav ----------
function renderWeekNav() {
  weekRangeEl.textContent = formatWeekRange(weekStart);
  const weekDates = getWeekDates(weekStart);
  const pct = weekDates.map((d) => dayPercent(d)).filter((p) => p !== null);
  if (pct.length === 0) {
    weekAvgEl.textContent = "Sin tareas esta semana";
  } else {
    const avg = Math.round(pct.reduce((a, b) => a + b, 0) / pct.length);
    weekAvgEl.textContent = `Promedio semanal: ${avg}%`;
  }
}

// ---------- Day tabs ----------
function renderDayTabs() {
  dayTabsEl.innerHTML = "";
  const weekDates = getWeekDates(weekStart);
  const today = new Date();

  for (const date of weekDates) {
    const pct = dayPercent(date);
    const btn = document.createElement("button");
    btn.className = "day-tab";
    if (isSameDate(date, today)) btn.classList.add("is-today");
    if (isSameDate(date, selectedDate)) btn.classList.add("is-selected");
    if (pct !== null && pct < 70) btn.classList.add("is-low");

    btn.innerHTML = `
      <span class="weekday">${weekdayShort(date)}</span>
      <span class="date-num">${date.getDate()}</span>
      <span class="mini-bar"><span style="width:${pct ?? 0}%"></span></span>
    `;
    btn.addEventListener("click", () => {
      selectedDate = date;
      renderDayTabs();
      renderDayView();
    });
    dayTabsEl.appendChild(btn);
  }
}

// ---------- Day view ----------
function tasksForDate(date) {
  const iso = toISODate(date);
  return tasks.filter((t) => t.date === iso);
}

function dayPercent(date) {
  const dayTasks = tasksForDate(date);
  if (dayTasks.length === 0) return null;
  const done = dayTasks.filter((t) => t.status === "done").length;
  return Math.round((done / dayTasks.length) * 100);
}

function renderDayView() {
  const dayTasks = tasksForDate(selectedDate).sort((a, b) => a.hour - b.hour);
  const total = dayTasks.length;
  const done = dayTasks.filter((t) => t.status === "done").length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  dayTitleEl.textContent = formatDayTitle(selectedDate);
  dayFractionEl.textContent =
    total === 0 ? "Sin tareas todavía" : `${done} de ${total} tareas completadas`;
  dayPercentEl.textContent = `${pct}%`;

  const offset = RING_CIRCUMFERENCE * (1 - pct / 100);
  ringProgressEl.style.strokeDashoffset = total === 0 ? RING_CIRCUMFERENCE : offset;
  ringProgressEl.classList.toggle("is-low", total > 0 && pct < 70);

  const isToday = isSameDate(selectedDate, new Date());
  if (isToday && total > 0 && pct < 70) {
    const missing = Math.ceil(total * 0.7) - done;
    alertBannerEl.hidden = false;
    alertTextEl.textContent = `Vas ${pct}% hoy. Te faltan ${missing} tarea${missing === 1 ? "" : "s"} para llegar al 70%.`;
  } else {
    alertBannerEl.hidden = true;
  }

  quickAddHour.value = String(isToday ? new Date().getHours() : 9);

  renderHours(dayTasks);
}

function renderHours(dayTasks) {
  hoursListEl.innerHTML = "";
  const currentHour = new Date().getHours();
  const isToday = isSameDate(selectedDate, new Date());

  for (let h = 0; h < 24; h++) {
    const row = document.createElement("li");
    row.className = "hour-row";
    if (isToday && h === currentHour) row.classList.add("is-current-hour");

    const label = document.createElement("span");
    label.className = "hour-label";
    label.textContent = hourLabel(h);
    row.appendChild(label);

    const body = document.createElement("div");
    body.className = "hour-tasks";

    const hourTasks = dayTasks.filter((t) => t.hour === h);
    for (const task of hourTasks) {
      body.appendChild(renderTask(task));
    }

    const addBtn = document.createElement("button");
    addBtn.className = "hour-add";
    addBtn.type = "button";
    addBtn.textContent = `Agregar a las ${hourLabel(h)}`;
    addBtn.addEventListener("click", () => {
      quickAddHour.value = String(h);
      quickAddTitle.focus();
    });
    body.appendChild(addBtn);

    row.appendChild(body);
    hoursListEl.appendChild(row);
  }
}

function renderTask(task) {
  const li = document.createElement("li");
  li.className = "task";
  if (task.status === "done") li.classList.add("is-done");
  if (task.status === "skipped") li.classList.add("is-skipped");

  const check = document.createElement("button");
  check.className = "task-check";
  check.type = "button";
  check.setAttribute("aria-label", "Marcar como completada");
  check.innerHTML =
    task.status === "done"
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : task.status === "skipped"
      ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'
      : "";
  check.addEventListener("click", () => toggleDone(task));

  const body = document.createElement("div");
  body.className = "task-body";

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;
  body.appendChild(title);

  if (task.status === "skipped" && task.reason) {
    const reasonP = document.createElement("p");
    reasonP.className = "task-reason";
    reasonP.textContent = task.reason;
    body.appendChild(reasonP);
  }

  if (pendingReasonEditorId === task.id) {
    body.appendChild(renderReasonEditor(task));
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const skipBtn = document.createElement("button");
  skipBtn.type = "button";
  skipBtn.className = "task-skip";
  if (task.status === "skipped") skipBtn.classList.add("is-active");
  skipBtn.setAttribute("aria-label", "Marcar como no realizada");
  skipBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M9 12h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  skipBtn.addEventListener("click", () => {
    pendingReasonEditorId = pendingReasonEditorId === task.id ? null : task.id;
    renderDayView();
  });
  actions.appendChild(skipBtn);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.setAttribute("aria-label", "Eliminar tarea");
  delBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  delBtn.addEventListener("click", () => deleteTask(task));
  actions.appendChild(delBtn);

  li.appendChild(check);
  li.appendChild(body);
  li.appendChild(actions);
  return li;
}

function renderReasonEditor(task) {
  const wrap = document.createElement("div");
  wrap.className = "reason-editor";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "¿Por qué no la hiciste? (opcional)";
  textarea.value = task.reason || "";

  const actionsRow = document.createElement("div");
  actionsRow.className = "reason-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "reason-save";
  saveBtn.textContent = "Marcar como no realizada";
  saveBtn.addEventListener("click", async () => {
    await TaskStore.update(task.id, { status: "skipped", reason: textarea.value.trim() });
    tasks = await TaskStore.list();
    pendingReasonEditorId = null;
    renderAll();
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", () => {
    pendingReasonEditorId = null;
    renderDayView();
  });

  actionsRow.appendChild(saveBtn);
  actionsRow.appendChild(cancelBtn);
  wrap.appendChild(textarea);
  wrap.appendChild(actionsRow);
  return wrap;
}

async function toggleDone(task) {
  const nextStatus = task.status === "done" ? "pending" : "done";
  await TaskStore.update(task.id, { status: nextStatus, reason: nextStatus === "done" ? "" : task.reason });
  tasks = await TaskStore.list();
  renderAll();
}

async function deleteTask(task) {
  await TaskStore.remove(task.id);
  tasks = await TaskStore.list();
  renderAll();
  showUndoToast(task);
}

function showUndoToast(removedTask) {
  undoBuffer = removedTask;
  toastTextEl.textContent = "Tarea eliminada";
  toastEl.hidden = false;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    toastEl.hidden = true;
    undoBuffer = null;
  }, 5000);
}

async function undoDelete() {
  if (!undoBuffer) return;
  await TaskStore.restore(undoBuffer);
  tasks = await TaskStore.list();
  undoBuffer = null;
  toastEl.hidden = true;
  clearTimeout(undoTimer);
  renderAll();
}

// ---------- Quick add ----------
function populateHourSelect() {
  quickAddHour.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    const opt = document.createElement("option");
    opt.value = String(h);
    opt.textContent = hourLabel(h);
    quickAddHour.appendChild(opt);
  }
}

async function handleQuickAdd(e) {
  e.preventDefault();
  const title = quickAddTitle.value.trim();
  if (!title) return;
  const hour = Number(quickAddHour.value);
  await TaskStore.add({ date: toISODate(selectedDate), hour, title });
  tasks = await TaskStore.list();
  quickAddTitle.value = "";
  quickAddTitle.focus();
  renderAll();
}

// ---------- Theme ----------
function applyTheme() {
  const root = document.documentElement;
  if (settings.theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", settings.theme);
  }
  const isDark =
    settings.theme === "dark" ||
    (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  el("themeIcon").innerHTML = isDark
    ? '<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="2"/>'
    : '<path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.91-.1-1.36A5.5 5.5 0 0 1 12 3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
}

function toggleTheme() {
  const order = ["system", "light", "dark"];
  const isDarkNow =
    settings.theme === "dark" ||
    (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  settings = SettingsStore.set({ theme: isDarkNow ? "light" : "dark" });
  applyTheme();
}

// ---------- Settings panel ----------
function openSettings() {
  settingsPanel.hidden = false;
  overlayEl.hidden = false;
}
function closeSettings() {
  settingsPanel.hidden = true;
  overlayEl.hidden = true;
}

function restoreSettingsUI() {
  el("reminderEnabled").checked = settings.reminderEnabled;
  el("reminderTime").value = settings.reminderTime;
  updateNotifStatus();
}

function updateNotifStatus() {
  const status = el("notifStatus");
  if (!("Notification" in window)) {
    status.textContent = "Este navegador no admite notificaciones.";
    return;
  }
  if (Notification.permission === "granted") {
    status.textContent = "Notificaciones permitidas.";
  } else if (Notification.permission === "denied") {
    status.textContent = "Notificaciones bloqueadas en el navegador.";
  } else {
    status.textContent = "Notificaciones no solicitadas todavía.";
  }
}

// ---------- Reminder ----------
function checkReminder() {
  if (!settings.reminderEnabled) return;
  const now = new Date();
  const todayISO = toISODate(now);
  if (settings.lastAlertDate === todayISO) return;

  const [hh, mm] = settings.reminderTime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);
  if (now < target) return;

  const pct = dayPercent(now);
  if (pct === null || pct >= 70) return;

  settings = SettingsStore.set({ lastAlertDate: todayISO });
  triggerReminder(now, pct);
}

function triggerReminder(date, pct) {
  const pending = tasksForDate(date).filter((t) => t.status !== "done");

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Todavía podés llegar al 70%", {
      body: `Vas ${pct}% hoy. Te quedan ${pending.length} tarea${pending.length === 1 ? "" : "s"} pendiente${pending.length === 1 ? "" : "s"}.`,
    });
  }

  el("reminderModalText").textContent = `Vas ${pct}% hoy. Estas son tus tareas pendientes:`;
  const list = el("reminderModalList");
  list.innerHTML = "";
  for (const t of pending.slice(0, 8)) {
    const li = document.createElement("li");
    li.textContent = `${hourLabel(t.hour)} · ${t.title}`;
    list.appendChild(li);
  }
  reminderModal.hidden = false;
}

// ---------- Events ----------
function bindEvents() {
  el("prevWeek").addEventListener("click", () => {
    weekStart = addDays(weekStart, -7);
    renderAll();
  });
  el("nextWeek").addEventListener("click", () => {
    weekStart = addDays(weekStart, 7);
    renderAll();
  });
  el("todayBtn").addEventListener("click", () => {
    weekStart = startOfWeek(new Date());
    selectedDate = new Date();
    renderAll();
  });

  el("themeToggle").addEventListener("click", toggleTheme);
  el("settingsToggle").addEventListener("click", openSettings);
  el("settingsClose").addEventListener("click", closeSettings);
  overlayEl.addEventListener("click", closeSettings);

  quickAddForm.addEventListener("submit", handleQuickAdd);

  el("alertDismiss").addEventListener("click", () => {
    alertBannerEl.hidden = true;
  });

  el("reminderEnabled").addEventListener("change", (e) => {
    settings = SettingsStore.set({ reminderEnabled: e.target.checked });
  });
  el("reminderTime").addEventListener("change", (e) => {
    settings = SettingsStore.set({ reminderTime: e.target.value, lastAlertDate: null });
  });
  el("notifPermBtn").addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
    updateNotifStatus();
  });

  el("toastUndo").addEventListener("click", undoDelete);
  el("reminderModalClose").addEventListener("click", () => {
    reminderModal.hidden = true;
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (settings.theme === "system") applyTheme();
  });
}

init();
