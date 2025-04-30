document.getElementById('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            document.getElementById('login-error').style.display = 'block';
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [
            { email: 'admin@shelfscan.com', password: 'admin123', name: 'Admin', role: 'admin' },
            { email: 'cashier@shelfscan.com', password: 'cashier123', name: 'Cashier', role: 'cashier' }
        ];

        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'index.html';
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    } catch (e) {
        console.error('Error during login:', e);
        document.getElementById('login-error').textContent = 'An error occurred. Please try again.';
        document.getElementById('login-error').style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page loaded');
    try {
        if (localStorage.getItem('currentUser')) {
            window.location.href = 'index.html';
        }
        document.getElementById('email').focus();
    } catch (e) {
        console.error('Error on login page load:', e);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    if (settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
});