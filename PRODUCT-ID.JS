let products = JSON.parse(localStorage.getItem('products')) || [];

function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.trim().toLowerCase();
    const criteria = document.getElementById('search-criteria').value;

    const filteredProducts = products.filter(product => {
        if (criteria === 'product_id') {
            return product.product_id.toLowerCase().includes(searchTerm);
        } else if (criteria === 'name') {
            return product.name.toLowerCase().includes(searchTerm);
        } else if (criteria === 'category') {
            return product.category.toLowerCase().includes(searchTerm);
        }
        return false;
    });

    const resultsTable = document.getElementById('product-results');
    resultsTable.innerHTML = '';
    filteredProducts.forEach(product => {
        const row = resultsTable.insertRow();
        row.innerHTML = `
            <td>${product.product_id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.mfg_date || 'Unknown'}</td>
            <td>${product.expiry_date}</td>
            <td class="${product.statusClass}">${product.status}</td>
        `;
    });
}

function sortTable(column, order) {
    const resultsTable = document.getElementById('product-results');
    const rows = Array.from(resultsTable.rows);
    rows.sort((a, b) => {
        let valA = a.cells[column === 'product_id' ? 0 : column === 'name' ? 1 : column === 'category' ? 2 : column === 'mfg_date' ? 3 : column === 'expiry_date' ? 4 : 5].textContent;
        let valB = b.cells[column === 'product_id' ? 0 : column === 'name' ? 1 : column === 'category' ? 2 : column === 'mfg_date' ? 3 : column === 'expiry_date' ? 4 : 5].textContent;
        if (column === 'mfg_date' || column === 'expiry_date') {
            valA = new Date(valA) || new Date(0);
            valB = new Date(valB) || new Date(0);
        }
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });
    resultsTable.innerHTML = '';
    rows.forEach(row => resultsTable.appendChild(row));
}

document.getElementById('search-btn').addEventListener('click', searchProducts);

document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.dataset.sort;
        const currentSort = th.getAttribute('aria-sort');
        const newSort = currentSort === 'ascending' ? 'descending' : 'ascending';

        document.querySelectorAll('th[data-sort]').forEach(header => {
            header.setAttribute('aria-sort', 'none');
        });
        th.setAttribute('aria-sort', newSort);

        sortTable(column, newSort === 'ascending' ? 'asc' : 'desc');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('username-display').textContent = `Welcome, ${currentUser.name}`;
        console.log('Product ID page loaded for user:', currentUser.name);
    } catch (e) {
        console.error('Error on product ID page load:', e);
        window.location.href = 'login.html';
    }
});
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('currentUser')) {
        window.location.href = './login.html';
    }
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    if (settings.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
});
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    alert('Logged out successfully!');
    window.location.href = './login.html';
});