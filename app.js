// PIXEL POS PRO - Advanced Mobile POS Logic

const state = {
    settings: {
        shopName: 'PIXEL POS',
        shopAddress: '123 Tech Avenue, Colombo',
        currency: 'Rs.',
        shopLogo: null
    },
    products: [
        { id: '1', name: 'Premium Ceylon Tea', price: 1250, stock: 45, barcode: '12345678' },
        { id: '2', name: 'Digital Watch X', price: 8500, stock: 12, barcode: '87654321' },
        { id: '3', name: 'Neon Shades', price: 3200, stock: 8, barcode: '11223344' }
    ],
    cart: [],
    transactions: [],
    currentView: 'pos-view'
};

let html5QrCode = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeApp();
    
    // Smooth loader fade
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        loader.classList.add('hidden');
    }, 1500);
});

function initializeApp() {
    renderUI();
    setupEventListeners();
}

function renderUI() {
    updateHeader();
    renderPOSProducts();
    renderInventory();
    renderTransactions();
    renderCart();
    renderSettings();
    updateStats();
}

// --- Storage Management ---
function loadData() {
    const savedSettings = localStorage.getItem('pixel_pos_settings');
    if (savedSettings) state.settings = JSON.parse(savedSettings);

    const savedProducts = localStorage.getItem('pixel_pos_products');
    if (savedProducts) state.products = JSON.parse(savedProducts);

    const savedTrans = localStorage.getItem('pixel_pos_history');
    if (savedTrans) state.transactions = JSON.parse(savedTrans);
}

function saveData() {
    localStorage.setItem('pixel_pos_settings', JSON.stringify(state.settings));
    localStorage.setItem('pixel_pos_products', JSON.stringify(state.products));
    localStorage.setItem('pixel_pos_history', JSON.stringify(state.transactions));
}

// --- Core Rendering Logic ---

function updateHeader() {
    const logoContainer = document.querySelector('.header-logo');
    if (state.settings.shopLogo) {
        logoContainer.innerHTML = `<img src="${state.settings.shopLogo}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-md);">`;
    } else {
        logoContainer.innerHTML = `<i class="fas fa-bolt"></i>`;
    }

    document.getElementById('header-shop-name').textContent = state.settings.shopName;
    const titles = {
        'pos-view': 'Terminal',
        'products-view': 'Inventory',
        'transactions-view': 'Orders',
        'settings-view': 'Setup'
    };
    document.getElementById('header-view-title').textContent = titles[state.currentView];
}

function updateStats() {
    const posCount = state.products.length;
    document.getElementById('stat-items-count').textContent = `${posCount} Items`;
}

function renderPOSProducts(filter = '') {
    const list = document.getElementById('pos-products-list');
    list.innerHTML = '';
    
    const filtered = state.products.filter(p => 
        p.name.toLowerCase().includes(filter.toLowerCase()) || 
        (p.barcode && p.barcode.includes(filter))
    );

    filtered.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
            <div class="item-main">
                <h4>${product.name}</h4>
                <p>${product.stock} in stock</p>
            </div>
            <div class="item-action">
                <span class="item-price">${state.settings.currency} ${parseFloat(product.price).toFixed(2)}</span>
                <button class="btn-add-cart" onclick="addToCart('${product.id}')">Add <i class="fas fa-plus-circle"></i></button>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';

    state.products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'inventory-item';
        const stockStatus = product.stock > 10 ? 'stock-ok' : 'stock-warn';
        
        item.innerHTML = `
            <div class="item-main">
                <div style="font-weight: 700;">${product.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                    ${state.settings.currency} ${parseFloat(product.price).toFixed(2)} • Barcode: ${product.barcode || 'N/A'}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="stock-lvl ${stockStatus}">${product.stock} units</span>
                <button class="icon-btn" style="width: 32px; height: 32px; border-color: var(--accent);" onclick="editProduct('${product.id}')">
                    <i class="fas fa-pen" style="font-size: 0.75rem; color: var(--accent);"></i>
                </button>
                <button class="icon-btn" style="width: 32px; height: 32px; border-color: var(--danger);" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash" style="font-size: 0.75rem; color: var(--danger);"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    list.innerHTML = '';

    if (state.transactions.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: var(--text-secondary); margin-top: 5rem;">No orders recorded.</div>';
        return;
    }

    [...state.transactions].reverse().forEach(t => {
        const card = document.createElement('div');
        card.className = 'transaction-card';
        card.onclick = () => showTransactionReceipt(t);
        card.innerHTML = `
            <div class="trans-top">
                <h5>Order #${t.id.slice(-4)}</h5>
                <span>${state.settings.currency} ${parseFloat(t.total).toFixed(2)}</span>
            </div>
            <div class="trans-date">
                <i class="far fa-calendar"></i> ${new Date(t.date).toLocaleDateString()} at ${new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div class="trans-date">
                <i class="fas fa-shopping-bag"></i> ${t.items.length} items sold
            </div>
        `;
        list.appendChild(card);
    });
}

function renderCart() {
    const list = document.getElementById('cart-items-list');
    const banner = document.getElementById('cart-banner');
    list.innerHTML = '';
    
    let total = 0;
    let count = 0;

    state.cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        count += item.quantity;

        const row = document.createElement('div');
        row.className = 'cart-item-card';
        row.innerHTML = `
            <div class="item-info">
                <div style="font-weight: 700;">${item.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">${state.settings.currency} ${parseFloat(item.price).toFixed(2)}</div>
            </div>
            <div class="qty-ctrl">
                <button class="icon-btn" style="width: 24px; height: 24px;" onclick="updateCartQty(${index}, -1)"><i class="fas fa-minus"></i></button>
                <span class="qty-num">${item.quantity}</span>
                <button class="icon-btn" style="width: 24px; height: 24px;" onclick="updateCartQty(${index}, 1)"><i class="fas fa-plus"></i></button>
            </div>
        `;
        list.appendChild(row);
    });

    // Update Totals
    const totalStr = `${state.settings.currency} ${total.toFixed(2)}`;
    document.getElementById('summary-subtotal').textContent = totalStr;
    document.getElementById('summary-total').textContent = totalStr;
    document.getElementById('banner-cart-total').textContent = totalStr;
    document.getElementById('banner-cart-count').textContent = count;

    // Banner Visibility
    banner.style.display = (count > 0 && state.currentView === 'pos-view') ? 'flex' : 'none';
}

function renderSettings() {
    document.getElementById('shop-name-input').value = state.settings.shopName;
    document.getElementById('shop-address-input').value = state.settings.shopAddress;
    document.getElementById('currency-input').value = state.settings.currency;
}

// --- Interactions ---

function setupEventListeners() {
    // Nav Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.getAttribute('data-view'));
        });
    });

    // POS Search
    document.getElementById('product-search').addEventListener('input', (e) => {
        renderPOSProducts(e.target.value);
    });

    // Settings Update
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        state.settings.shopName = document.getElementById('shop-name-input').value;
        state.settings.shopAddress = document.getElementById('shop-address-input').value;
        state.settings.currency = document.getElementById('currency-input').value;
        
        const logoFile = document.getElementById('shop-logo-input').files[0];
        if (logoFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                state.settings.shopLogo = event.target.result;
                saveData();
                renderUI();
                showToast('Settings Updated');
            };
            reader.readAsDataURL(logoFile);
        } else {
            saveData();
            renderUI();
            showToast('Settings Updated');
        }
    });

    // Cart Modal Controls
    document.getElementById('open-cart-btn').addEventListener('click', () => {
        openModal('cart-modal');
    });
    document.getElementById('close-cart-modal').addEventListener('click', () => {
        closeModal('cart-modal');
    });

    // Product Modal Controls
    document.getElementById('add-product-btn').addEventListener('click', () => {
        openProductModal();
    });
    document.getElementById('close-modal').addEventListener('click', () => {
        closeModal('product-modal');
    });
    
    document.getElementById('product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProduct();
    });

    // Transaction Actions
    document.getElementById('checkout-btn').addEventListener('click', completeTransaction);
    document.getElementById('clear-cart').addEventListener('click', () => {
        state.cart = [];
        renderCart();
        closeModal('cart-modal');
    });

    // System Actions
    document.getElementById('clear-data-btn').addEventListener('click', () => {
        if(confirm('Are you absolutely sure? This will delete EVERYTHING.')) {
            localStorage.clear();
            location.reload();
        }
    });

    // Scanner
    document.getElementById('scan-barcode-btn').addEventListener('click', startScanner);
    document.getElementById('scan-modal-btn').addEventListener('click', startScanner);
    document.getElementById('stop-scan-btn').addEventListener('click', stopScanner);
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
    });

    state.currentView = viewId;
    updateHeader();
    renderCart(); // Banner refresh
}

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return showToast('Insufficient Stock', 'error');

    const cartIdx = state.cart.findIndex(item => item.id === productId);
    if (cartIdx > -1) {
        state.cart[cartIdx].quantity += 1;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
    
    renderCart();
    showToast(`${product.name} added`);
}

function updateCartQty(index, delta) {
    state.cart[index].quantity += delta;
    if (state.cart[index].quantity <= 0) {
        state.cart.splice(index, 1);
    }
    renderCart();
}

function completeTransaction() {
    if (state.cart.length === 0) return;

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const transaction = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: [...state.cart],
        total: total
    };

    // Deduct Stock
    state.cart.forEach(item => {
        const prod = state.products.find(p => p.id === item.id);
        if (prod) prod.stock -= item.quantity;
    });

    state.transactions.push(transaction);
    state.cart = [];

    saveData();
    renderUI();
    closeModal('cart-modal');
    showTransactionReceipt(transaction);
    showToast('Sale Completed!', 'success');
}

// --- Dynamic Modals ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'block';
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

function openProductModal(id = null) {
    const form = document.getElementById('product-form');
    form.reset();
    document.getElementById('edit-product-id').value = '';

    if (id) {
        const p = state.products.find(prod => prod.id === id);
        document.getElementById('modal-title').textContent = 'Modify Product';
        document.getElementById('edit-product-id').value = p.id;
        document.getElementById('prod-name-input').value = p.name;
        document.getElementById('prod-price-input').value = p.price;
        document.getElementById('prod-stock-input').value = p.stock;
        document.getElementById('prod-barcode-input').value = p.barcode || '';
    } else {
        document.getElementById('modal-title').textContent = 'New Product Entry';
    }

    openModal('product-modal');
}

function saveProduct() {
    const id = document.getElementById('edit-product-id').value;
    const name = document.getElementById('prod-name-input').value.trim();
    const price = parseFloat(document.getElementById('prod-price-input').value);
    const stock = parseInt(document.getElementById('prod-stock-input').value);
    const barcode = document.getElementById('prod-barcode-input').value.trim();

    if (!name || isNaN(price)) return showToast('Invalid details', 'error');

    const productData = {
        id: id || Date.now().toString(),
        name,
        price,
        stock: isNaN(stock) ? 0 : stock,
        barcode
    };

    if (id) {
        const idx = state.products.findIndex(p => p.id === id);
        state.products[idx] = productData;
    } else {
        state.products.push(productData);
    }

    saveData();
    renderUI();
    closeModal('product-modal');
    showToast('Product Information Saved');
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        state.products = state.products.filter(p => p.id !== id);
        saveData();
        renderUI();
        showToast('Product Deleted', 'error');
    }
}

function showTransactionReceipt(transaction) {
    const modal = document.createElement('div');
    modal.className = 'full-modal glass show';
    modal.id = 'receipt-modal';
    
    let itemsHtml = transaction.items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span>${item.name} x ${item.quantity}</span>
            <span>${state.settings.currency} ${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="modal-header">
            <h3>Order Details</h3>
            <button class="close-modal-btn" onclick="this.closest('#receipt-modal').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body scrollable">
            <div class="receipt-card glass" style="padding: 1.5rem; border-radius: var(--radius-lg); border: 1px dashed var(--glass-border);">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <h4 style="font-size: 1.2rem; font-weight: 800;">${state.settings.shopName}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">${state.settings.shopAddress}</p>
                </div>
                <div style="border-top: 1px dashed rgba(255,255,255,0.1); border-bottom: 1px dashed rgba(255,255,255,0.1); padding: 1rem 0; margin-bottom: 1rem;">
                    ${itemsHtml}
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem;">
                    <span>Grand Total</span>
                    <span>${state.settings.currency} ${transaction.total.toFixed(2)}</span>
                </div>
                <div style="text-align: center; margin-top: 2rem; font-size: 0.75rem; color: var(--text-secondary);">
                    <p>Transaction ID: ${transaction.id}</p>
                    <p>${new Date(transaction.date).toLocaleString()}</p>
                    <p style="margin-top: 1rem; font-weight: 700;">THANK YOU FOR YOUR VISIT!</p>
                </div>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button class="action-btn-danger flex" onclick="this.closest('#receipt-modal').remove()">Close</button>
                <button class="action-btn-primary flex" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// --- Utilities ---

function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
        background: ${type === 'error' ? 'var(--danger)' : 'var(--bg-card)'};
        backdrop-filter: blur(15px); padding: 14px 28px; border-radius: 99px;
        color: white; font-weight: 700; z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: var(--glass-border);
        animation: toastFly 0.4s forwards, toastOut 0.4s 1.6s forwards;
    `;
    toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-times-circle' : 'fa-check-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.innerHTML = `
        @keyframes toastFly { from { top: -60px; opacity: 0; } to { top: 30px; opacity: 1; } }
        @keyframes toastOut { from { top: 30px; opacity: 1; } to { top: -60px; opacity: 0; } }
    `;
    if (!document.getElementById('toast-style')) document.head.appendChild(style);

    setTimeout(() => toast.remove(), 2100);
}

// --- Advanced Scanner ---

async function startScanner() {
    document.getElementById('scanner-modal').style.display = 'flex';
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

    try {
        await html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 15, qrbox: { width: 250, height: 250 } }, 
            (code) => onScanSuccess(code)
        );
    } catch (err) {
        showToast("Access Denied", 'error');
        stopScanner();
    }
}

function stopScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => document.getElementById('scanner-modal').style.display = 'none')
        .catch(() => document.getElementById('scanner-modal').style.display = 'none');
    } else {
        document.getElementById('scanner-modal').style.display = 'none';
    }
}

function onScanSuccess(code) {
    stopScanner();
    
    // Case 1: POS View - Add to cart
    if (state.currentView === 'pos-view') {
        const p = state.products.find(prod => prod.barcode === code);
        if (p) {
            addToCart(p.id);
            openModal('cart-modal');
        } else {
            showToast("Unregistered Barcode", 'error');
        }
        return;
    }

    // Case 2: Product Modal is open - Fill barcode field
    const productModal = document.getElementById('product-modal');
    if (productModal.classList.contains('show')) {
        const inp = document.getElementById('prod-barcode-input');
        if (inp) inp.value = code;
        return;
    }

    // Case 3: Inventory View - Find and highlight product
    if (state.currentView === 'products-view') {
        const p = state.products.find(prod => prod.barcode === code);
        if (p) {
            editProduct(p.id);
        } else {
            if (confirm("Barcode not found. Add as new product?")) {
                openProductModal();
                document.getElementById('prod-barcode-input').value = code;
            }
        }
    }
}
