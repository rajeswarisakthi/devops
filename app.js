// ===== DOM Elements =====
const taskForm    = document.getElementById('task-form');
const taskInput   = document.getElementById('task-input');
const taskList    = document.getElementById('task-list');
const emptyState  = document.getElementById('empty-state');
const totalCount  = document.getElementById('total-count');
const activeCount = document.getElementById('active-count');
const completedCount = document.getElementById('completed-count');
const progressBar = document.getElementById('progress-bar');
const btnClear    = document.getElementById('btn-clear');
const filterBtns  = document.querySelectorAll('.filter-btn');

// ===== State =====
let tasks = JSON.parse(localStorage.getItem('student-tasks')) || [];
let currentFilter = 'all';

// ===== Helpers =====

/** Save tasks array to localStorage */
function saveTasks() {
  localStorage.setItem('student-tasks', JSON.stringify(tasks));
}

/** Generate a simple unique ID */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Format a timestamp to a short readable string */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('en-US', options);
}

// ===== Rendering =====

/** Update the stats bar (total, active, completed, progress) */
function updateStats() {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active    = total - completed;

  totalCount.textContent     = total;
  activeCount.textContent    = active;
  completedCount.textContent = completed;

  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressBar.style.width = pct + '%';
}

/** Render the full task list based on the current filter */
function renderTasks() {
  taskList.innerHTML = '';

  const filtered = tasks.filter(task => {
    if (currentFilter === 'active')    return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true; // 'all'
  });

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
  }

  filtered.forEach((task, index) => {
    const li = createTaskElement(task, index);
    taskList.appendChild(li);
  });

  updateStats();
}

/** Build a single <li> element for a task */
function createTaskElement(task, index) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '');
  li.style.animationDelay = (index * 0.04) + 's';
  li.dataset.id = task.id;

  // Checkbox
  const checkboxLabel = document.createElement('label');
  checkboxLabel.className = 'task-checkbox';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as ' + (task.completed ? 'incomplete' : 'complete'));
  checkbox.addEventListener('change', () => toggleTask(task.id));

  const checkmark = document.createElement('span');
  checkmark.className = 'checkmark';
  checkmark.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`;

  checkboxLabel.appendChild(checkbox);
  checkboxLabel.appendChild(checkmark);

  // Text
  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = task.text;

  // Timestamp
  const time = document.createElement('span');
  time.className = 'task-time';
  time.textContent = formatTime(task.createdAt);

  // Delete button
  const btnDel = document.createElement('button');
  btnDel.className = 'btn-delete';
  btnDel.setAttribute('aria-label', 'Delete task');
  btnDel.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>`;
  btnDel.addEventListener('click', () => deleteTask(task.id, li));

  li.appendChild(checkboxLabel);
  li.appendChild(span);
  li.appendChild(time);
  li.appendChild(btnDel);

  return li;
}

// ===== CRUD Operations =====

/** Add a new task */
function addTask(text) {
  const task = {
    id: generateId(),
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
  };
  tasks.unshift(task); // newest first
  saveTasks();
  renderTasks();
}

/** Toggle the completed state of a task */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

/** Delete a task with exit animation */
function deleteTask(id, li) {
  li.classList.add('removing');
  li.addEventListener('animationend', () => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  });
}

/** Clear all completed tasks */
function clearCompleted() {
  // Animate all completed items out
  const completedItems = taskList.querySelectorAll('.task-item.completed');
  if (completedItems.length === 0) return;

  let removed = 0;
  completedItems.forEach(li => {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      removed++;
      if (removed === completedItems.length) {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
      }
    });
  });
}

// ===== Event Listeners =====

// Form submit — add task
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }
  addTask(text);
  taskInput.value = '';
  taskInput.focus();
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Clear completed
btnClear.addEventListener('click', clearCompleted);

// ===== Init =====
renderTasks();
