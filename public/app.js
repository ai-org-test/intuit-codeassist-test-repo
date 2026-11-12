const STORAGE_KEY = "checkboard.tasks";

const health = document.querySelector("#health");
const form = document.querySelector("#composer");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const empty = document.querySelector("#empty");
const remaining = document.querySelector("#remaining");
const filters = [...document.querySelectorAll(".filter")];

let tasks = loadTasks();
let filter = "all";

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({ id: crypto.randomUUID(), title, done: false });
  input.value = "";
  persist();
  render();
});

document.querySelector("#load-samples").addEventListener("click", async () => {
  const response = await fetch("/api/samples");
  const body = await response.json();
  const samples = body.tasks.map((task) => ({
    id: crypto.randomUUID(),
    title: task.title,
    done: Boolean(task.done),
  }));
  tasks = [...samples, ...tasks];
  persist();
  render();
});

document.querySelector("#clear-done").addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  persist();
  render();
});

for (const button of filters) {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    for (const item of filters) item.classList.toggle("is-active", item === button);
    render();
  });
}

list.addEventListener("change", (event) => {
  const row = event.target.closest("[data-id]");
  if (!row || event.target.type !== "checkbox") return;
  const task = tasks.find((item) => item.id === row.dataset.id);
  if (!task) return;
  task.done = event.target.checked;
  persist();
  render();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='delete']");
  if (!button) return;
  const id = button.closest("[data-id]")?.dataset.id;
  tasks = tasks.filter((task) => task.id !== id);
  persist();
  render();
});

checkHealth();
render();

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    const body = await response.json();
    if (!response.ok || !body.ok) throw new Error("unhealthy");
    health.dataset.state = "ready";
    health.textContent = "Server ready";
  } catch {
    health.dataset.state = "down";
    health.textContent = "Server unavailable";
  }
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((task) => task && typeof task.title === "string" && task.id);
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function visibleTasks() {
  if (filter === "active") return tasks.filter((task) => !task.done);
  if (filter === "done") return tasks.filter((task) => task.done);
  return tasks;
}

function render() {
  const visible = visibleTasks();
  const left = tasks.filter((task) => !task.done).length;
  remaining.textContent = `${left} left`;
  empty.hidden = visible.length > 0;
  list.replaceChildren(
    ...visible.map((task) => {
      const item = document.createElement("li");
      item.className = task.done ? "task is-done" : "task";
      item.dataset.id = task.id;
      item.dataset.testid = "task";
      item.dataset.taskTitle = task.title;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.setAttribute("aria-label", `Mark "${task.title}" done`);
      checkbox.dataset.testid = "task-toggle";

      const title = document.createElement("span");
      title.className = "title";
      title.textContent = task.title;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete";
      remove.dataset.action = "delete";
      remove.dataset.testid = "task-delete";
      remove.setAttribute("aria-label", `Delete ${task.title}`);
      remove.textContent = "×";

      item.append(checkbox, title, remove);
      return item;
    }),
  );
}
