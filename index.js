import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://fapfvfjpdlpwqmhdkwrq.supabase.co";

const SUPABASE_KEY = "sb_publishable_MPonINXgw0fQ59XBlhvNsA_R0Fdz_8G";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// -------------------------
// MATERIAL NAMES
// -------------------------

const materials = [
  "Marble",
  "Slate",
  "Wood",
  "Iron",
  "Copper",
  "Glass",
  "Quartz",
  "Granite",
  "Steel",
  "Clay",
  "Brick",
  "Stone",
  "Tile",
  "Cedar",
  "Oak",
  "Silver",
];

function makeMarbleName() {
  return materials[Math.floor(Math.random() * materials.length)];
}

// -------------------------
// ELEMENTS
// -------------------------

const authView = document.querySelector("#authView");

const appView = document.querySelector("#appView");

const email = document.querySelector("#email");

const password = document.querySelector("#password");

const signIn = document.querySelector("#signIn");

const signUp = document.querySelector("#signUp");

const signOut = document.querySelector("#signOut");

const authMessage = document.querySelector("#authMessage");

const marbleName = document.querySelector("#marbleName");

const tasks = document.querySelector("#tasks");

const add = document.querySelector("#add");

const taskSheet = document.querySelector("#taskSheet");

const newTask = document.querySelector("#newTask");

const dueDate = document.querySelector("#dueDate");

const dueDateButton = document.querySelector("#dueDateButton");

const datePickerPanel = document.querySelector("#datePickerPanel");

const datePickerMonth = document.querySelector("#datePickerMonth");

const datePickerDays = document.querySelector("#datePickerDays");

const previousMonth = document.querySelector("#previousMonth");

const nextMonth = document.querySelector("#nextMonth");

const clearDueDate = document.querySelector("#clearDueDate");

const saveTask = document.querySelector("#saveTask");

// -------------------------
// AUTH
// -------------------------

signUp.addEventListener("click", async () => {
  authMessage.textContent = "Creating account...";
  signUp.disabled = true;

  const { data, error } = await supabase.auth.signUp({
    email: email.value.trim(),
    password: password.value,
    options: {
      data: {
        marble_name: makeMarbleName(),
      },
    },
  });

  signUp.disabled = false;

  if (error) {
    console.error(error);
    authMessage.textContent = error.message;
    return;
  }

  if (!data.session) {
    authMessage.textContent = "Check your email.";
    return;
  }

  authMessage.textContent = "Done.";
  showApp(data.user);
});

async function login() {
  authMessage.textContent = "Signing in...";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });

  if (error) {
    console.error(error);
    authMessage.textContent = error.message;
    return;
  }

  authMessage.textContent = "";
  showApp(data.user);
}

signOut.addEventListener("click", async () => {
  await supabase.auth.signOut();

  appView.classList.add("hidden");
  authView.classList.remove("hidden");

  tasks.innerHTML = "";
});

signIn.addEventListener("click", login);

// -------------------------
// APP
// -------------------------

async function showApp(user) {
  authView.classList.add("hidden");
  appView.classList.remove("hidden");

  marbleName.textContent =
    "Your Name Is " + user.user_metadata?.marble_name ?? "Stone";

  await loadTasks();
}

// -------------------------
// LOAD TASKS
// -------------------------

async function loadTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return;
  }

  tasks.innerHTML = "";

  for (const task of data) {
    renderTask(task);
  }
}

// -------------------------
// RENDER
// -------------------------

function renderTask(task) {
  const row = document.createElement("div");

  row.className = "task";

  const check = document.createElement("button");

  check.className = "check" + (task.completed ? " completed" : "");

  check.setAttribute("aria-label", "Complete");

  check.innerHTML = `
    <iconify-icon
      icon="fluent:checkmark-20-regular">
    </iconify-icon>
  `;

  const text = document.createElement("div");

  text.className = "taskText" + (task.completed ? " completed" : "");

  text.textContent = task.text;

  if (task.due_date) {
    const due = document.createElement("div");
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const overdue = !task.completed && task.due_date < today;
    const formattedDate = new Date(
      `${task.due_date}T00:00:00`,
    ).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    due.className = "taskDue" + (overdue ? " overdue" : "");
    due.innerHTML = overdue
      ? `<iconify-icon icon="fluent:warning-20-regular"></iconify-icon> Overdue · ${formattedDate}`
      : `Due ${formattedDate}`;

    text.appendChild(due);
  }

  const remove = document.createElement("button");

  remove.className = "delete";

  remove.setAttribute("aria-label", "Delete");

  remove.innerHTML = `
    <iconify-icon
      icon="fluent:delete-20-regular">
    </iconify-icon>
  `;

  check.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { error } = await supabase
      .from("tasks")
      .update({
        completed: !task.completed,
      })
      .eq("id", task.id);

    if (error) {
      console.error(error);
      return;
    }

    await loadTasks();
  });

  remove.addEventListener("click", async () => {
    await supabase.from("tasks").delete().eq("id", task.id);

    row.remove();
  });

  row.append(check, text, remove);

  tasks.appendChild(row);
}

// -------------------------
// ADD TASK
// -------------------------

add.addEventListener("click", () => {
  taskSheet.classList.remove("hidden");

  newTask.value = "";
  resetDatePicker();

  setTimeout(() => {
    newTask.focus();
  }, 50);
});

taskSheet.addEventListener("click", (event) => {
  if (event.target === taskSheet) {
    taskSheet.classList.add("hidden");
  }
});

saveTask.addEventListener("click", createTask);

let pickerMonth = new Date();

function toIsoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDueDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderDatePicker() {
  const year = pickerMonth.getFullYear();
  const month = pickerMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toIsoDate(new Date());

  datePickerMonth.textContent = pickerMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  datePickerDays.innerHTML = "";

  for (let index = 0; index < firstDay; index += 1) {
    datePickerDays.appendChild(document.createElement("span"));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const value = toIsoDate(date);
    const button = document.createElement("button");

    button.type = "button";
    button.className = "datePickerDay";
    button.textContent = day;
    button.setAttribute("aria-label", formatDueDate(value));

    if (value === dueDate.value) button.classList.add("selected");
    if (value === today) button.classList.add("today");

    button.addEventListener("click", () => {
      dueDate.value = value;
      dueDateButton.textContent = formatDueDate(value);
      datePickerPanel.classList.add("hidden");
      renderDatePicker();
    });

    datePickerDays.appendChild(button);
  }
}

function resetDatePicker() {
  dueDate.value = "";
  dueDateButton.textContent = "Choose date";
  datePickerPanel.classList.add("hidden");
  pickerMonth = new Date();
  renderDatePicker();
}

dueDateButton.addEventListener("click", () => {
  if (dueDate.value) {
    const selected = new Date(`${dueDate.value}T00:00:00`);
    pickerMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  }

  renderDatePicker();
  datePickerPanel.classList.toggle("hidden");
});

previousMonth.addEventListener("click", () => {
  pickerMonth.setMonth(pickerMonth.getMonth() - 1);
  renderDatePicker();
});

nextMonth.addEventListener("click", () => {
  pickerMonth.setMonth(pickerMonth.getMonth() + 1);
  renderDatePicker();
});

clearDueDate.addEventListener("click", resetDatePicker);

renderDatePicker();

newTask.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    createTask();
  }
});

async function createTask() {
  const text = newTask.value.trim();
  const selectedDueDate = dueDate.value || null;

  if (!text) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    text,
    completed: false,
    due_date: selectedDueDate,
  });

  if (error) {
    console.error(error);
    return;
  }

  taskSheet.classList.add("hidden");

  await loadTasks();
}
document.addEventListener("contextmenu", (e) => {
  event.preventDefault();
});

document.addEventListener("click", () => {
  event.preventDefault();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

// -------------------------
// START MARBLE
// -------------------------

const {
  data: { session },
} = await supabase.auth.getSession();

if (session?.user) {
  showApp(session.user);
} else {
  authView.classList.remove("hidden");
}
