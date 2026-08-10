const API_URL = '/api';

// --- State ---
let currentUser = null;
let expensesData = [];
let tasksData = [];

// --- DOM Elements ---
// Auth
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');
const goToForgot = document.getElementById('go-to-forgot');
const backToLogin = document.getElementById('back-to-login');
const backToForgot = document.getElementById('back-to-forgot');

// Dashboard
const dashboardContainer = document.getElementById('dashboard-container');
const userNameDisplay = document.getElementById('user-name-display');
const logoutBtn = document.getElementById('logout-btn');
const currentDateDisplay = document.getElementById('current-date');
const pageTitle = document.getElementById('page-title');

// Nav
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.dashboard-section');

// Stats
const statTotalTasks = document.getElementById('stat-total-tasks');
const statTotalExpenses = document.getElementById('stat-total-expenses');
const statCompletedTasks = document.getElementById('stat-completed-tasks');
const recentExpensesList = document.getElementById('recent-expenses-list');
const recentTasksList = document.getElementById('recent-tasks-list');

// Expenses
const addExpenseBtn = document.getElementById('add-expense-btn');
const expenseFormContainer = document.getElementById('expense-form-container');
const expenseForm = document.getElementById('expense-form');
const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
const expensesTableBody = document.getElementById('expenses-table-body');

// Tasks
const addTaskBtn = document.getElementById('add-task-btn');
const taskFormContainer = document.getElementById('task-form-container');
const taskForm = document.getElementById('task-form');
const cancelTaskBtn = document.getElementById('cancel-task-btn');
const tasksList = document.getElementById('tasks-list');

// Toast
const toastContainer = document.getElementById('toast-container');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateDisplay.textContent = new Date().toLocaleDateString(undefined, options);

    // Check Auth
    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    
    if (storedUserId && storedUserName) {
        currentUser = { id: storedUserId, name: storedUserName };
        showDashboard();
    } else {
        showAuth();
    }
});

// --- UI Helpers ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
        <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showAuth() {
    authContainer.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
}

function showDashboard() {
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    userNameDisplay.textContent = currentUser.name;
    fetchData();
}

// --- Navigation ---
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        // Update active nav
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Update Title
        pageTitle.textContent = item.textContent.trim();

        // Show section
        const targetId = item.getAttribute('data-target');
        sections.forEach(sec => {
            if (sec.id === targetId) {
                sec.classList.remove('hidden');
                sec.classList.add('active-section');
            } else {
                sec.classList.add('hidden');
                sec.classList.remove('active-section');
            }
        });
    });
});

// --- Auth Toggle ---
function showOnlyForm(formEl) {
    [loginForm, registerForm, forgotPasswordForm, resetPasswordForm].forEach(f => f.classList.add('hidden'));
    formEl.classList.remove('hidden');
}

goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showOnlyForm(registerForm);
});

goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showOnlyForm(loginForm);
});

goToForgot.addEventListener('click', (e) => {
    e.preventDefault();
    // Pre-fill email from login field if present
    const loginEmail = document.getElementById('login-email').value;
    if (loginEmail) document.getElementById('forgot-email').value = loginEmail;
    showOnlyForm(forgotPasswordForm);
});

backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showOnlyForm(loginForm);
});

backToForgot.addEventListener('click', (e) => {
    e.preventDefault();
    showOnlyForm(forgotPasswordForm);
});

// --- API Helpers ---
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (currentUser) {
        headers['user-id'] = currentUser.id;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { msg: text || 'Unexpected server response' };
        }

        if (!response.ok) {
            throw new Error(data.msg || 'Something went wrong');
        }
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// --- Authentication ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await apiCall('/auth/login', 'POST', { email, password });
        currentUser = { id: data.userId, name: data.name };
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.name);
        showToast('Logged in successfully');
        loginForm.reset();
        showDashboard();
    } catch (error) {
        // Error handled in apiCall
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }

    try {
        const data = await apiCall('/auth/register', 'POST', { name, email, password });
        if (!data.userId) throw new Error('Registration failed. Please try again.');
        currentUser = { id: data.userId, name: data.name || name };
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', currentUser.name);
        showToast('Account created! Welcome.');
        registerForm.reset();
        showDashboard();
    } catch (error) {
        // Error handled in apiCall
    }
});

// --- Forgot Password ---
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const btn = document.getElementById('send-code-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        const data = await apiCall('/auth/forgot-password', 'POST', { email });
        showToast(data.msg, 'success');
        // Only navigate to reset form on success
        document.getElementById('reset-email').value = email;
        showOnlyForm(resetPasswordForm);
    } catch (error) {
        // Stay on forgot-password form so user can correct their email
    } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Reset Code';
    }
});

resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value.trim();
    const token = document.getElementById('reset-token').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
    }

    try {
        const data = await apiCall('/auth/reset-password', 'POST', { email, token, newPassword });
        showToast(data.msg || 'Password reset! Please sign in.', 'success');
        resetPasswordForm.reset();
        forgotPasswordForm.reset();
        showOnlyForm(loginForm);
    } catch (error) {
        // Handled in apiCall — stay on reset form so user can correct the code
    }
});

logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentUser = null;
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    showAuth();
});

// --- Data Fetching ---
async function fetchData() {
    try {
        const [expenses, tasks] = await Promise.all([
            apiCall('/expenses'),
            apiCall('/tasks')
        ]);
        expensesData = expenses;
        tasksData = tasks;
        updateUI();
    } catch (error) {
        console.error("Error fetching data", error);
    }
}

// --- UI Updating ---
function updateUI() {
    renderExpenses();
    renderTasks();
    updateOverview();
}

function updateOverview() {
    // Stats
    const totalExpenses = expensesData.reduce((acc, curr) => acc + curr.amount, 0);
    const completedTasks = tasksData.filter(t => t.status === 'completed').length;
    
    statTotalTasks.textContent = tasksData.length;
    statTotalExpenses.textContent = `₹${totalExpenses.toFixed(2)}`;
    statCompletedTasks.textContent = completedTasks;

    // Recent Expenses
    recentExpensesList.innerHTML = '';
    const recentExp = expensesData.slice(0, 4);
    if (recentExp.length === 0) {
        recentExpensesList.innerHTML = '<li class="empty-state">No recent expenses</li>';
    } else {
        recentExp.forEach(exp => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${exp.title}</span>
                <span style="font-weight: 600; color: var(--danger-color)">-₹${exp.amount.toFixed(2)}</span>
            `;
            recentExpensesList.appendChild(li);
        });
    }

    // Pending Tasks
    recentTasksList.innerHTML = '';
    const pendingTasks = tasksData.filter(t => t.status === 'pending').slice(0, 4);
    if (pendingTasks.length === 0) {
        recentTasksList.innerHTML = '<li class="empty-state">No pending tasks</li>';
    } else {
        pendingTasks.forEach(task => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span><i class="fa-regular fa-circle" style="color: var(--text-muted); margin-right: 8px;"></i> ${task.taskName}</span>
            `;
            recentTasksList.appendChild(li);
        });
    }
}

// --- Expenses Logic ---
addExpenseBtn.addEventListener('click', () => {
    expenseFormContainer.classList.remove('hidden');
});

cancelExpenseBtn.addEventListener('click', () => {
    expenseFormContainer.classList.add('hidden');
    expenseForm.reset();
});

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('expense-title').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    try {
        const newExpense = await apiCall('/expenses', 'POST', { title, amount, category });
        expensesData.unshift(newExpense);
        expenseForm.reset();
        expenseFormContainer.classList.add('hidden');
        showToast('Expense added');
        updateUI();
    } catch (error) {
        // Handled
    }
});

function renderExpenses() {
    expensesTableBody.innerHTML = '';
    if (expensesData.length === 0) {
        expensesTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No expenses found. Add one above!</td></tr>';
        return;
    }

    expensesData.forEach(exp => {
        const tr = document.createElement('tr');
        const date = new Date(exp.date).toLocaleDateString();
        tr.innerHTML = `
            <td>${date}</td>
            <td style="font-weight:500">${exp.title}</td>
            <td><span class="badge badge-${exp.category.toLowerCase()}">${exp.category}</span></td>
            <td style="font-weight:600">₹${exp.amount.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteExpense('${exp._id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        expensesTableBody.appendChild(tr);
    });
}

window.deleteExpense = async (id) => {
    if(confirm('Are you sure you want to delete this expense?')) {
        try {
            await apiCall(`/expenses/${id}`, 'DELETE');
            expensesData = expensesData.filter(e => e._id !== id);
            showToast('Expense deleted');
            updateUI();
        } catch (error) {
            // Handled
        }
    }
};

// --- Tasks Logic ---
addTaskBtn.addEventListener('click', () => {
    taskFormContainer.classList.remove('hidden');
});

cancelTaskBtn.addEventListener('click', () => {
    taskFormContainer.classList.add('hidden');
    taskForm.reset();
});

taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskName = document.getElementById('task-name').value;

    try {
        const newTask = await apiCall('/tasks', 'POST', { taskName });
        tasksData.unshift(newTask);
        taskForm.reset();
        taskFormContainer.classList.add('hidden');
        showToast('Task added');
        updateUI();
    } catch (error) {
        // Handled
    }
});

function renderTasks() {
    tasksList.innerHTML = '';
    if (tasksData.length === 0) {
        tasksList.innerHTML = '<li class="empty-state">No tasks found. Add one above!</li>';
        return;
    }

    tasksData.forEach(task => {
        const isCompleted = task.status === 'completed';
        const li = document.createElement('li');
        li.className = `task-item ${isCompleted ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="task-content" onclick="toggleTaskStatus('${task._id}', '${isCompleted ? 'pending' : 'completed'}')">
                <div class="task-checkbox ${isCompleted ? 'completed' : ''}"></div>
                <span class="task-name">${task.taskName}</span>
            </div>
            <button class="btn btn-sm btn-secondary" style="color: var(--danger-color); border:none;" onclick="deleteTask('${task._id}')">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        tasksList.appendChild(li);
    });
}

window.toggleTaskStatus = async (id, newStatus) => {
    try {
        await apiCall(`/tasks/${id}`, 'PUT', { status: newStatus });
        const taskIndex = tasksData.findIndex(t => t._id === id);
        if (taskIndex !== -1) {
            tasksData[taskIndex].status = newStatus;
        }
        updateUI();
    } catch (error) {
        // Handled
    }
};

window.deleteTask = async (id) => {
    if(confirm('Are you sure you want to delete this task?')) {
        try {
            await apiCall(`/tasks/${id}`, 'DELETE');
            tasksData = tasksData.filter(t => t._id !== id);
            showToast('Task deleted');
            updateUI();
        } catch (error) {
            // Handled
        }
    }
};
