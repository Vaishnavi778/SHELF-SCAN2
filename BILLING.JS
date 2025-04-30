let bills = JSON.parse(localStorage.getItem('bills')) || [];
let products = JSON.parse(localStorage.getItem('products')) || [];

function saveToLocalStorage() {
    try {
        localStorage.setItem('bills', JSON.stringify(bills));
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('sales', JSON.stringify(JSON.parse(localStorage.getItem('sales')) || []));
    } catch (e) {
        console.error('LocalStorage error:', e);
        alert('Error saving billing data. LocalStorage may be full or disabled.');
    }
}

function populateSessionFilter() {
    const sessionFilter = document.getElementById('bill-session-filter');
    const dateFilter = document.getElementById('bill-date-filter').value;
    let sessionIds = [...new Set(bills.map(bill => bill.session_id))].filter(id => id);

    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        sessionIds = sessionIds.filter(sessionId => {
            return bills.some(bill => {
                const billDate = new Date(bill.date);
                return bill.session_id === sessionId && billDate.toDateString() === filterDate.toDateString();
            });
        });
    }

    sessionFilter.innerHTML = '<option value="All">All Sessions</option>';
    sessionIds.forEach(sessionId => {
        const option = document.createElement('option');
        option.value = sessionId;
        option.textContent = sessionId;
        sessionFilter.appendChild(option);
    });
}

function populateProductSearch() {
    const productSearch = document.getElementById('product-search');
    productSearch.innerHTML = '<option value="" disabled selected>Select Product</option>';

    products.forEach(product => {
        const idOption = document.createElement('option');
        idOption.value = `id:${product.product_id}`;
        idOption.textContent = `ID: ${product.product_id}`;
        productSearch.appendChild(idOption);

        const nameOption = document.createElement('option');
        nameOption.value = `name:${product.name}`;
        nameOption.textContent = `Name: ${product.name}`;
        productSearch.appendChild(nameOption);
    });
}

function displayBills(filteredBills) {
    const table = document.getElementById('bill-list');
    table.innerHTML = '';
    filteredBills.forEach(bill => {
        const row = table.insertRow();
        row.innerHTML = `
            <td>${bill.bill_id}</td>
            <td>${bill.session_id || 'Unknown'}</td>
            <td>${bill.product_id}</td>
            <td>${bill.name}</td>
            <td>${bill.category}</td>
            <td>${bill.mfg_date || 'Unknown'}</td>
            <td>${bill.quantity}</td>
            <td>$${bill.price.toFixed(2)}</td>
            <td>$${bill.total.toFixed(2)}</td>
            <td>${new Date(bill.date).toLocaleDateString()}</td>
        `;
    });
}

function filterBills() {
    const dateFilter = document.getElementById('bill-date-filter').value;
    const sessionFilter = document.getElementById('bill-session-filter').value;

    let filteredBills = bills;

    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredBills = filteredBills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate.toDateString() === filterDate.toDateString();
        });
    }

    if (sessionFilter !== 'All') {
        filteredBills = filteredBills.filter(bill => bill.session_id === sessionFilter);
    }

    displayBills(filteredBills);
}

function startBarcodeScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    const qrReader = document.getElementById('qr-reader');
    const scanBtn = document.getElementById('scan-btn');
    const scannerStatus = document.getElementById('scanner-status');

    if (!window.Quagga) {
        scannerStatus.textContent = 'QuaggaJS library not loaded. Please check your internet connection and try again.';
        alert('QuaggaJS library not loaded. Please check your internet connection and try again.');
        return;
    }

    scannerContainer.style.display = 'block';
    scanBtn.disabled = true;
    scannerStatus.textContent = 'Scanning... Aim at a barcode.';

    Quagga.init({
        inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: qrReader,
            constraints: { facingMode: 'environment' }
        },
        decoder: { readers: ['ean_reader', 'upc_reader', 'code_128_reader'] }
    }, err => {
        if (err) {
            let errorMessage = 'Failed to start scanner. Please ensure camera permissions are granted and the site is served over HTTPS.';
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please ensure a camera is connected to your device.';
            }
            scannerStatus.textContent = errorMessage;
            alert(errorMessage);
            stopBarcodeScanner();
            return;
        }
        Quagga.start();
        scannerStatus.textContent = 'Scanning...';
    });

    Quagga.onDetected(data => {
        const decodedText = data.codeResult.code;
        const product = products.find(p => p.product_id === decodedText);
        if (product) {
            document.getElementById('product-id').value = product.product_id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('price').value = product.price.toFixed(2);
            document.getElementById('category').value = product.category;
            document.getElementById('quantity').value = '';
            document.getElementById('quantity').focus();
            scannerStatus.textContent = `Scanned: ${decodedText}`;
        } else {
            scannerStatus.textContent = `Scanned: ${decodedText} - Not found`;
            alert('This is a new product. Please add it to the inventory in Dashboard first.');
        }
        Quagga.stop();
        stopBarcodeScanner();
    });
}

function stopBarcodeScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    const scanBtn = document.getElementById('scan-btn');
    const scannerStatus = document.getElementById('scanner-status');

    if (window.Quagga) {
        Quagga.stop();
    }
    scannerContainer.style.display = 'none';
    scanBtn.disabled = false;
    scannerStatus.textContent = 'Scanner stopped.';
}

// Hardware scanner support
let barcodeBuffer = [];
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && barcodeBuffer.length) {
        const barcode = barcodeBuffer.join('');
        const product = products.find(p => p.product_id === barcode);
        if (product) {
            document.getElementById('product-id').value = product.product_id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('price').value = product.price.toFixed(2);
            document.getElementById('category').value = product.category;
            document.getElementById('quantity').value = '';
            document.getElementById('quantity').focus();
            alert(`Scanned barcode: ${barcode} (via hardware scanner)`);
        } else {
            alert('This is a new product. Please add it to the inventory in Dashboard first.');
        }
        barcodeBuffer = [];
    } else if (e.key !== 'Enter') {
        barcodeBuffer.push(e.key);
    }
});

function generateTotalBill() {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        alert('No active session. Please add some bills first.');
        return;
    }

    const sessionBills = bills.filter(bill => bill.session_id === sessionId);
    if (sessionBills.length === 0) {
        alert('No bills in the current session.');
        return;
    }

    const totalAmount = sessionBills.reduce((sum, bill) => sum + bill.total, 0);
    alert(`Total Bill for Session ${sessionId}: $${totalAmount.toFixed(2)}`);

    // Save session data under the first bill ID
    if (sessionBills.length > 0) {
        const billId = sessionBills[0].bill_id;
        let completedBills = JSON.parse(localStorage.getItem('completedBills')) || {};
        completedBills[billId] = {
            session_id: sessionId,
            bills: sessionBills,
            total: totalAmount,
            date: new Date().toISOString()
        };
        localStorage.setItem('completedBills', JSON.stringify(completedBills));
    }

    // Reset for new session
    sessionStorage.removeItem('sessionId');
    document.getElementById('bill-list').innerHTML = '';
    document.getElementById('bill-form').reset();
    populateSessionFilter();
}

function downloadBillsCSV() {
    const sessionFilter = document.getElementById('bill-session-filter').value;
    const dateFilter = document.getElementById('bill-date-filter').value;

    let filteredBills = bills;
    let filename = `bills_${new Date().toISOString().split('T')[0]}.csv`;

    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredBills = filteredBills.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate.toDateString() === filterDate.toDateString();
        });
        filename = `bills_${dateFilter}.csv`;
    }

    if (sessionFilter !== 'All') {
        filteredBills = filteredBills.filter(bill => bill.session_id === sessionFilter);
        filename = `bills_${sessionFilter}.csv`;
    }

    if (filteredBills.length === 0) {
        alert('No bills available to download for the selected session or date.');
        return;
    }

    const headers = ['Bill ID', 'Session ID', 'Product ID', 'Product Name', 'Category', 'MFG Date', 'Quantity', 'Price per Unit', 'Total', 'Date'];
    const rows = filteredBills.map(bill => [
        bill.bill_id,
        bill.session_id || 'Unknown',
        bill.product_id,
        `"${bill.name.replace(/"/g, '""')}"`,
        bill.category,
        bill.mfg_date || 'Unknown',
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

function sortBills(column, order) {
    bills.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        if (column === 'date' || column === 'mfg_date') {
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
    filterBills();
}

document.getElementById('bill-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const productId = document.getElementById('product-id').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const product = products.find(p => p.product_id === productId);

    if (!product) {
        alert('Product not found. Please select or scan a valid product.');
        submitBtn.disabled = false;
        return;
    }

    if (isNaN(quantity) || quantity <= 0 || quantity > product.quantity) {
        alert('Please enter a valid quantity within available stock.');
        submitBtn.disabled = false;
        return;
    }

    // Update product quantity
    product.quantity -= quantity;
    if (product.quantity === 0) {
        products = products.filter(p => p.product_id !== productId);
    }

    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'SESSION' + Date.now();
        sessionStorage.setItem('sessionId', sessionId);
    }

    const bill = {
        bill_id: 'BILL' + (bills.length + 1).toString().padStart(4, '0'),
        session_id: sessionId,
        product_id: productId,
        name: product.name,
        category: product.category,
        mfg_date: product.mfg_date || 'Unknown',
        quantity,
        price: product.price,
        total: product.price * quantity,
        date: new Date().toISOString()
    };
    bills.push(bill);

    // Record sale
    const sale = {
        product_id: productId,
        quantity,
        date: bill.date
    };
    let sales = JSON.parse(localStorage.getItem('sales')) || [];
    sales.push(sale);
    localStorage.setItem('sales', JSON.stringify(sales));

    saveToLocalStorage();
    filterBills();
    populateSessionFilter();
    populateProductSearch();
    document.getElementById('bill-form').reset();
    submitBtn.disabled = false;
    alert(`Added bill for ${quantity} unit(s) of ${product.name} for $${bill.total.toFixed(2)} (Bill ID: ${bill.bill_id}, Session ID: ${bill.session_id})`);
});

document.getElementById('product-search').addEventListener('change', function() {
    const value = this.value;
    if (!value) return;

    const [type, searchValue] = value.split(':');
    const product = products.find(p => 
        (type === 'id' && p.product_id === searchValue) ||
        (type === 'name' && p.name === searchValue)
    );

    if (product) {
        document.getElementById('product-id').value = product.product_id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('price').value = product.price.toFixed(2);
        document.getElementById('category').value = product.category;
        document.getElementById('quantity').value = '';
        document.getElementById('quantity').focus();
    }
});

document.getElementById('scan-btn').addEventListener('click', startBarcodeScanner);
document.getElementById('stop-scan-btn').addEventListener('click', stopBarcodeScanner);
document.getElementById('generate-bill-report').addEventListener('click', filterBills);
document.getElementById('total-bill-btn').addEventListener('click', generateTotalBill);
document.getElementById('download-bills-csv').addEventListener('click', downloadBillsCSV);
document.getElementById('bill-session-filter').addEventListener('change', filterBills);
document.getElementById('bill-date-filter').addEventListener('change', () => {
    populateSessionFilter();
    filterBills();
});

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('currentUser')) {
    window.location.href = './login.html';
}
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        document.getElementById('username-display').textContent = `Welcome, ${currentUser.name}`;
        console.log('Billing page loaded for user:', currentUser.name);
        bills = JSON.parse(localStorage.getItem('bills')) || [];
        products = JSON.parse(localStorage.getItem('products')) || [];
        populateSessionFilter();
        populateProductSearch();
        displayBills(bills);
    } catch (e) {
        console.error('Error on billing page load:', e);
        window.location.href = 'login.html';
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
document.getElementById('logout-btn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('currentUser');
  alert('Logged out successfully!');
  window.location.href = './login.html';
});