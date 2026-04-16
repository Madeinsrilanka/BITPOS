const APP_STORAGE_KEY = 'POSBIT_DATA';

const DB = {
    // Initial State
    state: {
        products: [],
        sales: [],
        settings: {
            shopName: "POSBIT Clothing",
            address: "123 Fashion Street, Colombo",
            phone: "+94 77 123 4567",
            currency: "Rs.",
            taxRate: 0,
            invoicePrefix: "INV-",
            nextInvoiceNo: 1001,
            footerText: "Thank you for shopping with us!"
        },
        user: null
    },

    // Initialize with Firebase and LocalStorage
    init() {
        this.loadLocal();
        
        // Listen for Firebase Updates
        if (typeof firebase !== 'undefined' && FirebaseSync.init()) {
            this.db = firebase.database();
            
            // Sync Products
            this.db.ref('products').on('value', (snap) => {
                const data = snap.val();
                this.state.products = data ? Object.values(data) : [];
                this.saveLocal();
                if (typeof Router !== 'undefined' && Router.currentPath === 'products') Router.navigate('products');
            });

            // Sync Sales
            this.db.ref('sales').on('value', (snap) => {
                const data = snap.val();
                this.state.sales = data ? Object.values(data) : [];
                this.saveLocal();
            });

            // Sync Settings
            this.db.ref('settings').on('value', (snap) => {
                const data = snap.val();
                if (data) this.state.settings = { ...this.state.settings, ...data };
                this.saveLocal();
            });
        }
    },

    loadLocal() {
        const data = localStorage.getItem(APP_STORAGE_KEY);
        if (data) this.state = JSON.parse(data);
    },

    saveLocal() {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(this.state));
    },

    // --- Product Methods ---
    getProducts() { return this.state.products; },
    addProduct(product) {
        product.id = Date.now().toString();
        if (this.db) {
            this.db.ref('products/' + product.id).set(product);
        } else {
            this.state.products.push(product);
            this.saveLocal();
        }
    },
    updateProduct(id, updatedProduct) {
        if (this.db) {
            this.db.ref('products/' + id).update(updatedProduct);
        } else {
            const index = this.state.products.findIndex(p => p.id === id);
            if (index !== -1) {
                this.state.products[index] = { ...this.state.products[index], ...updatedProduct };
                this.saveLocal();
            }
        }
    },
    deleteProduct(id) {
        if (this.db) {
            this.db.ref('products/' + id).remove();
        } else {
            this.state.products = this.state.products.filter(p => p.id !== id);
            this.saveLocal();
        }
    },

    // --- Sales Methods ---
    getSales() { return this.state.sales; },
    addSale(sale) {
        sale.id = Date.now().toString();
        sale.invoiceNo = this.state.settings.invoicePrefix + this.state.settings.nextInvoiceNo;
        sale.timestamp = new Date().toISOString();
        
        if (this.db) {
            // Transactional update for stock would be better, but simple set for now
            this.db.ref('sales/' + sale.id).set(sale);
            this.state.settings.nextInvoiceNo++;
            this.db.ref('settings/nextInvoiceNo').set(this.state.settings.nextInvoiceNo);
            
            // Update Inventory in Firebase
            sale.items.forEach(item => {
                const product = this.state.products.find(p => p.id === item.id);
                if (product) {
                    const newStock = Math.max(0, product.stock - item.quantity);
                    this.db.ref('products/' + item.id + '/stock').set(newStock);
                }
            });
        } else {
            this.state.sales.push(sale);
            this.state.settings.nextInvoiceNo++;
            this.saveLocal();
        }
        return sale;
    },

    // --- Settings Methods ---
    getSettings() { return this.state.settings; },
    updateSettings(newSettings) {
        if (this.db) {
            this.db.ref('settings').update(newSettings);
        } else {
            this.state.settings = { ...this.state.settings, ...newSettings };
            this.saveLocal();
        }
    }
};

// Initialize DB after Firebase check
setTimeout(() => DB.init(), 1000);
