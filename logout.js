document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            try {
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('sessionId');
                console.log('User logged out');
                window.location.href = 'login.html';
            } catch (e) {
                console.error('Error during logout:', e);
                alert('Error logging out. Please try again.');
            }
        });
    }
});