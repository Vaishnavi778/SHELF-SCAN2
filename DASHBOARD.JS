let products = JSON.parse(localStorage.getItem('products')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let bills = JSON.parse(localStorage.getItem('bills')) || [];

// Mock product database for barcode lookup
const productDatabase = {
    '123456789012': {
        name: 'ChocoBar',
        mfg_date: '2025-01-01',
        expiry_date: '2025-12-31',
        price: 2.99,
        category: 'Brand Me Chocolates'
    },
    '987654321098': {
        name: 'DrawingPad',
        mfg_date: '2025-02-01',
        expiry_date: '2026-02-01',
        price: 5.00,
        category: 'Drawing File'
    },
    '456789123456': {
        name: 'CannedSoup',
        mfg_date: '2025-03-01',
        expiry_date: '2026-03-01',
        price: 1.50,
        category: 'Foods'
    }
};

// Assign defaults to existing products
products = products.map(product => ({
    ...product,
    category: product.category || 'Other',
    price: product.price || 0,
    mfg_date: product.mfg_date || 'Unknown',
    quantity: product.quantity || 0
}));
localStorage.setItem('products', JSON.stringify(products));

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('sales', JSON.stringify(sales));
        localStorage.setItem('bills', JSON.stringify(bills));
    } catch (e) {
        console.error('LocalStorage error:', e);
        alert('Error saving data. LocalStorage may be full or disabled.');
    }
}

document.getElementById('product-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const name = sanitizeInput(document.getElementById('product-name').value.trim());
    const id = sanitizeInput(document.getElementById('product-id').value.trim());
    const mfgDate = document.getElementById('mfg-date').value;
    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    const expiryDate = document.getElementById('expiry-date').value;
    const category = document.getElementById('category').value;

    if (!name || !id || !mfgDate || isNaN(price) || price < 0 || isNaN(quantity) || quantity < 1 || !expiryDate || !category) {
        alert('Please fill in all fields with valid values.');
        submitBtn.disabled = false;
        return;
    }

    const mfg = new Date(mfgDate);
    const expiry = new Date(expiryDate);
    if (isNaN(mfg.getTime()) || isNaN(expiry.getTime()) || mfg > expiry) {
        alert('Please enter valid manufacturing and expiry dates (MFG must be before expiry).');
        submitBtn.disabled = false;
        return;
    }

    if (products.some(p => p.product_id === id)) {
        alert('Product ID already exists.');
        submitBtn.disabled = false;
        return;
    }

    const currentDate = new Date();
    let status = 'Safe';
    let statusClass = 'safe';

    if (expiry < currentDate) {
        status = 'Expired';
        statusClass = 'expired';
    } else if ((expiry - currentDate) / (1000 * 60 * 60 * 24) <= 7) {
        status = 'Warning';
        statusClass = 'warning';
    }

    const product = { name, product_id: id, mfg_date: mfgDate, price, quantity, expiry_date: expiryDate, status, statusClass, category };
    products.push(product);
    saveToLocalStorage();
    addProductToTable(product);
    document.getElementById('product-form').reset();
    submitBtn.disabled = false;
    updateProductTable();
});

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Helper function to infer expiry date based on category
function inferExpiryDate(mfgDate, category) {
    const mfg = new Date(mfgDate);
    let expiry = new Date(mfg);
    if (category === 'Foods' || category === 'Brand Me Chocolates' || category === 'Beverages') {
        expiry.setFullYear(mfg.getFullYear() + 1); // 1 year for food items
    } else if (category === 'Drawing File' || category === 'Stationery') {
        expiry.setFullYear(mfg.getFullYear() + 2); // 2 years for drawing files and stationery
    } else {
        expiry.setFullYear(mfg.getFullYear() + 1); // Default 1 year
    }
    return formatDate(expiry);
}

// Helper function to generate random price between 25 and 50
function generateRandomPrice() {
    const min = 25.00;
    const max = 50.00;
    return (Math.random() * (max - min) + min).toFixed(2);
}

// Barcode scanning with QuaggaJS
function startBarcodeScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    const qrReader = document.getElementById('qr-reader');
    const scanBtn = document.getElementById('scan-btn');
    const scannerStatus = document.getElementById('scanner-status');

    if (!window.Quagga) {
        scannerStatus.textContent = 'QuaggaJS library not loaded. Please check your internet connection and try again.';
        console.error('QuaggaJS library not loaded.');
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
            console.error('Quagga init error:', err);
            stopBarcodeScanner();
            return;
        }
        Quagga.start();
        scannerStatus.textContent = 'Scanning...';
    });

    Quagga.onDetected(data => {
        const decodedText = data.codeResult.code;
        document.getElementById('product-id').value = decodedText;

        // Look up product in database
        const productInfo = productDatabase[decodedText];
        if (productInfo) {
            document.getElementById('product-name').value = productInfo.name;
            document.getElementById('mfg-date').value = productInfo.mfg_date;
            document.getElementById('expiry-date').value = productInfo.expiry_date;
            document.getElementById('price').value = productInfo.price.toFixed(2);
            document.getElementById('category').value = productInfo.category;
            document.getElementById('quantity').value = ''; // Quantity is manually filled
        } else {
            // Fallback: infer values for unknown barcodes
            const inferredName = `Scanned Product ${decodedText}`;
            document.getElementById('product-name').value = inferredName;

            // Infer category based on barcode or name
            let inferredCategory = 'Other';
            if (decodedText.includes('123')) {
                inferredCategory = 'Foods';
            } else if (decodedText.includes('987')) {
                inferredCategory = 'Drawing File';
            } else if (inferredName.toLowerCase().includes('choco')) {
                inferredCategory = 'Brand Me Chocolates';
            }
            document.getElementById('category').value = inferredCategory;

            // Infer MFG date (default to today)
            const today = formatDate(new Date());
            document.getElementById('mfg-date').value = today;

            // Infer expiry date based on category
            document.getElementById('expiry-date').value = inferExpiryDate(today, inferredCategory);

            // Random price between 25 and 50
            document.getElementById('price').value = generateRandomPrice();
            document.getElementById('quantity').value = ''; // Quantity is manually filled
        }

        document.getElementById('quantity').focus();
        scannerStatus.textContent = `Scanned: ${decodedText}`;
        Quagga.stop();
        stopBarcodeScanner();
        alert(`Scanned barcode: ${decodedText}`);
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

document.getElementById('scan-btn').addEventListener('click', startBarcodeScanner);
document.getElementById('stop-scan-btn').addEventListener('click', stopBarcodeScanner);

// Hardware scanner support
let barcodeBuffer = [];
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && barcodeBuffer.length) {
        const barcode = barcodeBuffer.join('');
        document.getElementById('product-id').value = barcode;

        // Look up product in database
        const productInfo = productDatabase[barcode];
        if (productInfo) {
            document.getElementById('product-name').value = productInfo.name;
            document.getElementById('mfg-date').value = productInfo.mfg_date;
            document.getElementById('expiry-date').value = productInfo.expiry_date;
            document.getElementById('price').value = productInfo.price.toFixed(2);
            document.getElementById('category').value = productInfo.category;
            document.getElementById('quantity').value = ''; // Quantity is manually filled
        } else {
            // Fallback: infer values for unknown barcodes
            const inferredName = `Scanned Product ${barcode}`;
            document.getElementById('product-name').value = inferredName;

            // Infer category based on barcode or name
            let inferredCategory = 'Other';
            if (barcode.includes('123')) {
                inferredCategory = 'Foods';
            } else if (barcode.includes('987')) {
                inferredCategory = 'Drawing File';
            } else if (inferredName.toLowerCase().includes('choco')) {
                inferredCategory = 'Brand Me Chocolates';
            }
            document.getElementById('category').value = inferredCategory;

            // Infer MFG date (default to today)
            const today = formatDate(new Date());
            document.getElementById('mfg-date').value = today;

            // Infer expiry date based on category
            document.getElementById('expiry-date').value = inferExpiryDate(today, inferredCategory);

            // Random price between 25 and 50
            document.getElementById('price').value = generateRandomPrice();
            document.getElementById('quantity').value = ''; // Quantity is manually filled
        }

        document.getElementById('quantity').focus();
        alert(`Scanned barcode: ${barcode} (via hardware scanner)`);
        barcodeBuffer = [];
    } else if (e.key !== 'Enter') {
        barcodeBuffer.push(e.key);
    }
});

function addProductToTable(product) {
    const table = document.getElementById('product-list');
    const row = table.insertRow();
    row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.product_id}</td>
        <td>${product.mfg_date}</td>
        <td>$${product.price.toFixed(2)}</td>
        <td>${product.quantity}</td>
        <td>${product.category}</td>
        <td>${product.expiry_date}</td>
        <td class="${product.statusClass}">${product.status}</td>
        <td>
            <button class="delete-btn" data-id="${product.product_id}" aria-label="Delete Product"><i class="material-icons">delete</i></button>
            <form class="sell-form" data-id="${product.product_id}" style="margin-top: 5px;">
                <input type="number" min="1" max="${product.quantity}" placeholder="Qty" aria-label="Quantity to Sell" required>
                <button type="submit" aria-label="Sell Product"><i class="material-icons">sell</i> Sell</button>
            </form>
        </td>
    `;

    row.querySelector('.delete-btn').addEventListener('click', function() {
        deleteProduct(product.product_id, row);
    });

    row.querySelector('.sell-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const quantity = parseInt(event.target.querySelector('input').value);
        if (isNaN(quantity) || quantity <= 0 || quantity > product.quantity) {
            alert('Please enter a valid quantity within available stock.');
            return;
        }
        recordSale(product.product_id, quantity);
        event.target.reset();
    });
}

function deleteProduct(productId, row) {
    products = products.filter(p => p.product_id !== productId);
    saveToLocalStorage();
    row.remove();
    updateSummary();
}

function recordSale(productId, quantity) {
    const product = products.find(p => p.product_id === productId);
    if (!product) {
        alert('Product not found.');
        return;
    }

    if (product.quantity < quantity) {
        alert('Not enough stock available.');
        return;
    }

    product.quantity -= quantity;
    if (product.quantity === 0) {
        products = products.filter(p => p.product_id !== productId);
    }

    const sale = {
        product_id: productId,
        quantity,
        date: new Date().toISOString()
    };
    sales.push(sale);

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
        date: sale.date
    };
    bills.push(bill);

    saveToLocalStorage();
    updateProductTable();
    alert(`Sold ${quantity} unit(s) of ${product.name} for $${bill.total.toFixed(2)} (Bill ID: ${bill.bill_id}, Session ID: ${bill.session_id})`);
}

function updateSummary() {
    const total = products.length;
    let expired = 0, warning = 0, safe = 0;

    products.forEach(product => {
        if (product.status === 'Expired') expired++;
        else if (product.status === 'Warning') warning++;
        else safe++;
    });

    document.getElementById('total').textContent = total;
    document.getElementById('expired').textContent = expired;
    document.getElementById('warning').textContent = warning;
    document.getElementById('safe').textContent = safe;
}

function updateProductTable() {
    const table = document.getElementById('product-list');
    table.innerHTML = '';
    products.forEach(product => addProductToTable(product));
    updateSummary();
}

function sortTable(column, order) {
    products.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        if (column === 'expiry_date' || column === 'mfg_date') {
            valA = new Date(valA) || new Date(0);
            valB = new Date(valB) || new Date(0);
        } else if (column === 'price' || column === 'quantity') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
        }
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });
    updateProductTable();
}

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
        console.log('Dashboard loaded for user:', currentUser.name);
        updateProductTable();
        console.log('QuaggaJS available:', !!window.Quagga);
    } catch (e) {
        console.error('Error on dashboard load:', e);
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