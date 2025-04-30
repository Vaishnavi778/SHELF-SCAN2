function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

document.getElementById('settings-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const theme = document.getElementById('theme').value;
    const notifications = document.getElementById('notifications').checked;
    const username = document.getElementById('username').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword && newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    // Save settings
    const settings = { theme, notifications, username };
    localStorage.setItem('settings', JSON.stringify(settings));

    // Update user password if provided
    if (newPassword) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            users = users.map(u => 
                u.email === currentUser.email ? { ...u, password: newPassword } : u
            );
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, password: newPassword }));
        }
    }

    // Apply theme
    applyTheme(theme);

    alert('Settings saved!');
});

document.getElementById('reset-settings').addEventListener('click', function() {
    localStorage.removeItem('settings');
    document.getElementById('settings-form').reset();
    applyTheme('light'); // Default to light theme
    alert('Settings reset!');
});

document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    alert('Logged out successfully!');
    window.location.href = './login.html';
});

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('currentUser')) {
        window.location.href = './login.html';
    }
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    if (settings.theme) {
        document.getElementById('theme').value = settings.theme;
        applyTheme(settings.theme);
    }
    if (settings.notifications) document.getElementById('notifications').checked = settings.notifications;
    if (settings.username) document.getElementById('username').value = settings.username;

    // Set username from current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && !settings.username) {
        document.getElementById('username').value = currentUser.name;
    }
});
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    alert('Logged out successfully!');
    window.location.href = './login.html';
});