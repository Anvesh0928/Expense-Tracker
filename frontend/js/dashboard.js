document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (!userId) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('user-name').innerText = `Welcome, ${userName}`;

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
    themeToggle.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // Toast
    const showToast = (msg) => {
        const toast = document.getElementById('toast');
        toast.innerText = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    };

    // Chart Instance
    let expenseChartInstance = null;

    const renderChart = (expenses) => {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Others'];
        const data = categories.map(cat => {
            return expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
        });

        if (expenseChartInstance) {
            expenseChartInstance.destroy();
        }

        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: data,
                    backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    // --- Expenses ---
    const loadExpenses = async () => {
        try {
            const res = await fetch('/api/expenses', {
                headers: { 'user-id': userId }
            });
            const expenses = await res.json();
            renderExpenses(expenses);
            updateStats(expenses);
            renderChart(expenses);
            return expenses;
        } catch (err) {
            console.error(err);
        }
    };

    const renderExpenses = (expenses) => {
        const list = document.getElementById('expense-list');
        list.innerHTML = '';
        expenses.forEach(exp => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-details">
                    <h4>${exp.title}</h4>
                    <span>${exp.category}</span> - ₹${exp.amount}
                </div>
                <div class="item-actions">
                    <button class="btn danger-btn" onclick="deleteExpense('${exp._id}')">Del</button>
                </div>
            `;
            list.appendChild(li);
        });
    };

    const updateStats = (expenses) => {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        document.getElementById('total-expenses').innerText = `₹${total}`;
    };

    document.getElementById('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('exp-title').value;
        const amount = document.getElementById('exp-amount').value;
        const category = document.getElementById('exp-category').value;

        try {
            await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'user-id': userId },
                body: JSON.stringify({ title, amount, category })
            });
            showToast('Expense Added');
            e.target.reset();
            loadExpenses();
        } catch (err) { console.error(err); }
    });

    window.deleteExpense = async (id) => {
        try {
            await fetch(`/api/expenses/${id}`, {
                method: 'DELETE',
                headers: { 'user-id': userId }
            });
            showToast('Expense Deleted');
            loadExpenses();
        } catch (err) { console.error(err); }
    };

    // Filter and Search
    let allExpenses = [];
    loadExpenses().then(data => allExpenses = data);

    const filterExpenses = () => {
        const search = document.getElementById('search-expense').value.toLowerCase();
        const category = document.getElementById('filter-category').value;
        
        let filtered = allExpenses.filter(exp => exp.title.toLowerCase().includes(search));
        if (category !== 'All') {
            filtered = filtered.filter(exp => exp.category === category);
        }
        renderExpenses(filtered);
    };

    document.getElementById('search-expense').addEventListener('input', filterExpenses);
    document.getElementById('filter-category').addEventListener('change', filterExpenses);

    // --- Tasks ---
    const loadTasks = async () => {
        try {
            const res = await fetch('/api/tasks', {
                headers: { 'user-id': userId }
            });
            const tasks = await res.json();
            renderTasks(tasks);
        } catch (err) { console.error(err); }
    };

    const renderTasks = (tasks) => {
        const list = document.getElementById('task-list');
        list.innerHTML = '';
        let pending = 0;
        let completed = 0;

        tasks.forEach(task => {
            if (task.status === 'completed') completed++;
            else pending++;

            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-details ${task.status === 'completed' ? 'completed' : ''}">
                    <h4>${task.taskName}</h4>
                </div>
                <div class="item-actions">
                    ${task.status === 'pending' ? `<button class="btn primary-btn" onclick="completeTask('${task._id}')">✓</button>` : ''}
                    <button class="btn danger-btn" onclick="deleteTask('${task._id}')">Del</button>
                </div>
            `;
            list.appendChild(li);
        });

        document.getElementById('pending-tasks').innerText = pending;
        document.getElementById('completed-tasks').innerText = completed;
    };

    document.getElementById('task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskName = document.getElementById('task-name').value;

        try {
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'user-id': userId },
                body: JSON.stringify({ taskName })
            });
            showToast('Task Added');
            e.target.reset();
            loadTasks();
        } catch (err) { console.error(err); }
    });

    window.completeTask = async (id) => {
        try {
            await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'user-id': userId },
                body: JSON.stringify({ status: 'completed' })
            });
            showToast('Task Completed');
            loadTasks();
        } catch (err) { console.error(err); }
    };

    window.deleteTask = async (id) => {
        try {
            await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'user-id': userId }
            });
            showToast('Task Deleted');
            loadTasks();
        } catch (err) { console.error(err); }
    };

    // Init
    loadExpenses();
    loadTasks();
});
