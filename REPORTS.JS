let sales = JSON.parse(localStorage.getItem('sales')) || [];
let bills = JSON.parse(localStorage.getItem('bills')) || [];

function saveToLocalStorage() {
    try {
        localStorage.setItem('sales', JSON.stringify(sales));
        localStorage.setItem('bills', JSON.stringify(bills));
    } catch (e) {
        console.error('LocalStorage error:', e);
        alert('Error saving data. LocalStorage may be full or disabled.');
    }
}

function displaySales(filteredBills) {
    const table = document.getElementById('sales-list');
    table.innerHTML = '';
    filteredBills.forEach(bill => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${bill.bill_id}</td>
            <td>${bill.session_id || 'Unknown'}</td>
            <td>${bill.product_id}</td>
            <td>${bill.name}</td>
            <td>${bill.category}</td>
            <td>${bill.quantity}</td>
            <td>$${bill.price.toFixed(2)}</td>
            <td>$${bill.total.toFixed(2)}</td>
            <td>${new Date(bill.date).toLocaleDateString()}</td>
        `;
    });
}

function updateSalesSummary(filteredBills) {
    const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalItems = filteredBills.reduce((sum, bill) => sum + bill.quantity, 0);
    const averageSale = filteredBills.length > 0 ? totalSales / filteredBills.length : 0;

    // Calculate most and least sold items
    const productQuantities = {};
    filteredBills.forEach(bill => {
        if (!productQuantities[bill.product_id]) {
            productQuantities[bill.product_id] = { name: bill.name, quantity: 0 };
        }
        productQuantities[bill.product_id].quantity += bill.quantity;
    });

    const sortedProducts = Object.entries(productQuantities).sort((a, b) => b[1].quantity - a[1].quantity);
    const mostSold = sortedProducts.length > 0 ? sortedProducts[0][1].name : 'N/A';
    const leastSold = sortedProducts.length > 0 ? sortedProducts[sortedProducts.length - 1][1].name : 'N/A';

    document.getElementById('total-sales').textContent = `$${totalSales.toFixed(2)}`;
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('average-sale').textContent = `$${averageSale.toFixed(2)}`;
    document.getElementById('most-sold').textContent = mostSold;
    document.getElementById('least-sold').textContent = leastSold;
}

function filterSales() {
    const dateFilter = document.getElementById('sales-date-filter').value;
    const categoryFilter = document.getElementById('sales-category-filter').value;

    let filteredBills = bills;

    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredBills = filteredBills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate.toDateString() === filterDate.toDateString();
        });
    }

    if (categoryFilter !== 'All') {
        filteredBills = filteredBills.filter(bill => bill.category === categoryFilter);
    }

    displaySales(filteredBills);
    updateSalesSummary(filteredBills);
}

function downloadSalesCSV() {
    const dateFilter = document.getElementById('sales-date-filter').value;
    const categoryFilter = document.getElementById('sales-category-filter').value;

    let filteredBills = bills;
    let filename = `sales_${new Date().toISOString().split('T')[0]}.csv`;

    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredBills = filteredBills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate.toDateString() === filterDate.toDateString();
        });
        filename = `sales_${dateFilter}.csv`;
    }

    if (categoryFilter !== 'All') {
        filteredBills = filteredBills.filter(bill => bill.category === categoryFilter);
        filename = `sales_${categoryFilter}_${dateFilter || new Date().toISOString().split('T')[0]}.csv`;
    }

    if (filteredBills.length === 0) {
        alert('No sales data available to download for the selected filters.');
        return;
    }

    const headers = ['Bill ID', 'Session ID', 'Product ID', 'Product Name', 'Category', 'Quantity', 'Price per Unit', 'Total', 'Date'];
    const rows = filteredBills.map(bill => [
        bill.bill_id,
        bill.session_id || 'Unknown',
        bill.product_id,
        `"${bill.name.replace(/"/g, '""')}"`,
        bill.category,
        bill.quantity,
        bill.price.toFixed(2),
        bill.total.toFixed(2),
        new Date(bill.date).toLocaleString()
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function clearSalesData() {
    if (confirm('Are you sure you want to clear all sales data? This action cannot be undone.')) {
        sales = [];
        bills = [];
        saveToLocalStorage();
        filterSales();
        alert('All sales data has been cleared.');
        console.log('Sales data cleared');
    }
}

function sortSales(column, order) {
    bills.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        if (column === 'date') {
            valA = new Date(valA) || new Date(0);
            valB = new Date(valB) || new Date(0);
        } else if (['quantity', 'price', 'total'].includes(column)) {
            valA = Number(valA);
            valB = Number(valB);
        }
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });
    filterSales();
}

document.getElementById('generate-sales-report').addEventListener('click', filterSales);
document.getElementById('download-sales-csv').addEventListener('click', downloadSalesCSV);
document.getElementById('clear-sales-data').addEventListener('click', clearSalesData);
document.getElementById('sales-date-filter').addEventListener('change', filterSales);
document.getElementById('sales-category-filter').addEventListener('change', filterSales);

document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.dataset.sort;
        const currentSort = th.getAttribute('aria-sort');
        const newSort = currentSort === 'ascending' ? 'descending' : 'ascending';

        document.querySelectorAll('th[data-sort]').forEach(header => {
            header.setAttribute('aria-sort', 'none');
        });
        th.setAttribute('aria-sort', newSort);

        sortSales(column, newSort === 'ascending' ? 'asc' : 'desc');
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
        console.log('Reports page loaded for user:', currentUser.name);
        filterSales();
    } catch (e) {
        console.error('Error on reports page load:', e);
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