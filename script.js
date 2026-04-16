/**
 * POSBIT - Main Application Script
 */

/**
 * Socket.io Sync (Node.js)
 */
const SocketSync = {
    socket: null,
    init() {
        if (typeof io === 'undefined') return false;
        this.socket = io();
        return true;
    }
};

const UI = {
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    },

    showModal(title, bodyHtml, showFooter = true) {
        const container = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        
        content.innerHTML = `
            <div class="px-6 py-4 flex items-center justify-between border-b bg-slate-50">
                <h3 class="text-lg font-bold text-slate-800">${title}</h3>
                <button onclick="UI.hideModal()" class="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div class="p-6 max-h-[70vh] overflow-y-auto">
                ${bodyHtml}
            </div>
            ${showFooter ? `
            <div class="px-6 py-4 bg-slate-50 border-t flex justify-end gap-3">
                <button onclick="UI.hideModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                <button id="modal-submit" class="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">Save Changes</button>
            </div>` : ''}
        `;
        
        container.classList.remove('hidden');
        container.classList.add('flex');
        setTimeout(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
            lucide.createIcons();
        }, 10);
    },

    hideModal() {
        const container = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        content.classList.add('scale-95', 'opacity-0');
        content.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            container.classList.add('hidden');
            container.classList.remove('flex');
            content.classList.remove('hidden'); // Ensure content itself isn't hidden for next time
        }, 200);
    },

    setLoggedIn(user) {
        localStorage.setItem('POSBIT_USER', JSON.stringify(user));
        location.reload(); // Safer to reload once for layout adjustment
    },

    logout() {
        localStorage.removeItem('POSBIT_USER');
        sessionStorage.removeItem('currentPath');
        location.reload();
    },

    notify(message, type = 'success') {
        const toast = document.createElement('div');
        const colorClass = type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';
        toast.className = `fixed bottom-6 right-6 ${colorClass} text-white px-6 py-3 rounded-2xl shadow-xl z-[1000] transform transition-all duration-300 translate-y-10 opacity-0`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        }, 10);
        
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

const Router = {
    currentPath: 'dashboard',
    
    init() {
        const user = localStorage.getItem('POSBIT_USER');
        if (!user) {
            this.navigate('login');
            // Complete UI Lock for Login
            document.getElementById('sidebar').classList.add('hidden');
            document.querySelector('main').classList.remove('lg:ml-64');
            document.querySelector('header').classList.add('hidden');
            return;
        }
        document.getElementById('sidebar').classList.remove('hidden');
        document.querySelector('main').classList.add('lg:ml-64');
        document.querySelector('header').classList.remove('hidden');

        let savedPath = sessionStorage.getItem('currentPath') || 'dashboard';
        if (savedPath === 'login') savedPath = 'dashboard';
        
        this.navigate(savedPath);
    },

    navigate(path) {
        this.currentPath = path;
        sessionStorage.setItem('currentPath', path);
        
        // Update sidebar UI
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.page === path) {
                link.classList.add('bg-white/10', 'text-white');
                link.classList.remove('text-slate-400');
            } else {
                link.classList.remove('bg-white/10', 'text-white');
                link.classList.add('text-slate-400');
            }
        });

        const viewContainer = document.getElementById('view-container');
        viewContainer.style.opacity = '0';
        
        setTimeout(() => {
            viewContainer.innerHTML = Views[path] ? Views[path].render() : '<h1>Page under construction</h1>';
            document.getElementById('page-title').textContent = path.charAt(0).toUpperCase() + path.slice(1);
            
            if (Views[path]?.afterRender) {
                Views[path].afterRender();
            }
            
            viewContainer.style.opacity = '1';
            lucide.createIcons();
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth < 1024) {
                document.getElementById('sidebar').classList.add('-translate-x-full');
                document.getElementById('sidebar-overlay').classList.add('hidden');
            }
        }, 150);
    }
};

const Utils = {
    generateBarcode() {
        const products = DB.getProducts();
        let barcode;
        let exists = true;
        
        while (exists) {
            barcode = Math.floor(10000000 + Math.random() * 90000000).toString();
            exists = products.some(p => p.barcode === barcode);
        }
        return barcode;
    }
};

const Views = {
    login: {
        render() {
            return `
                <div class="fixed inset-0 bg-slate-100 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
                    <div class="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"></div>
                    <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
                        <div class="p-8 text-center bg-slate-50 border-b">
                            <div class="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-xl shadow-indigo-200">
                                <i data-lucide="shopping-bag" class="w-10 h-10"></i>
                            </div>
                            <h2 class="text-3xl font-black text-slate-800 tracking-tight">POSBIT</h2>
                            <p class="text-slate-500 font-medium">Clothing Shop Management</p>
                        </div>
                        <div class="p-8">
                            <form id="login-form" class="space-y-6">
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Username</label>
                                    <div class="relative">
                                        <i data-lucide="user" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                                        <input type="text" name="username" required value="admin" class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 mb-2">Password</label>
                                    <div class="relative">
                                        <i data-lucide="lock" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                                        <input type="password" name="password" required value="1234" class="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                    </div>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <label class="flex items-center gap-2 text-slate-600 cursor-pointer">
                                        <input type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                                        Remember Me
                                    </label>
                                    <a href="#" class="text-indigo-600 font-bold">Forgot?</a>
                                </div>
                                <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 transition-all">
                                    Login to POS
                                </button>
                            </form>
                        </div>
                        <div class="p-4 text-center bg-slate-50 border-t text-xs text-slate-400">
                            v1.0.0 &bull; Licensed to POSBIT Store
                        </div>
                    </div>
                </div>
            `;
        },
        afterRender() {
            document.getElementById('login-form').onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const user = Object.fromEntries(formData.entries());
                // Mock Auth
                if (user.username === 'admin' && user.password === '1234') {
                    UI.setLoggedIn({ name: 'Admin', role: 'owner' });
                } else {
                    UI.notify('Invalid credentials!', 'error');
                }
            };
        }
    },
    dashboard: {
        render() {
            const products = DB.getProducts();
            const sales = DB.getSales();
            const totalStock = products.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0);
            const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString());
            const totalRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);

            return `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${this.statCard('Today Revenue', DB.state.settings.currency + ' ' + totalRevenue.toLocaleString(), 'dollar-sign', 'bg-emerald-100 text-emerald-600')}
                    ${this.statCard('Recent Orders', todaySales.length, 'shopping-cart', 'bg-blue-100 text-blue-600')}
                    ${this.statCard('Total Products', products.length, 'package', 'bg-indigo-100 text-indigo-600')}
                    ${this.statCard('Low Stock Items', products.filter(p => p.stock < 10).length, 'alert-triangle', 'bg-rose-100 text-rose-600')}
                </div>

                <div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="font-bold text-lg text-slate-800">Sales Overview</h3>
                            <button class="text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg">Last 7 Days</button>
                        </div>
                        <canvas id="salesChart" class="w-full h-64"></canvas>
                    </div>
                    
                    <div class="bg-white p-8 rounded-3xl premium-shadow border border-slate-50">
                        <h3 class="font-black text-xl text-slate-800 mb-8">Quick Actions</h3>
                        <div class="grid grid-cols-1 gap-4">
                            <button onclick="Router.navigate('billing')" class="tile-action w-full flex items-center gap-4 p-5 bg-indigo-600 text-white rounded-2xl group">
                                <div class="p-3 bg-white/20 rounded-xl"><i data-lucide="plus" class="w-6 h-6"></i></div>
                                <div class="text-left">
                                    <p class="font-black text-lg">New Sale</p>
                                    <p class="text-indigo-200 text-xs">Start a transaction</p>
                                </div>
                            </button>
                            <button onclick="Router.navigate('products')" class="tile-action w-full flex items-center gap-4 p-5 bg-white border border-slate-100 text-slate-800 rounded-2xl group">
                                <div class="p-3 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors"><i data-lucide="package-plus" class="w-6 h-6 group-hover:text-emerald-600"></i></div>
                                <div class="text-left">
                                    <p class="font-black text-lg">Inventory</p>
                                    <p class="text-slate-400 text-xs">Manage products</p>
                                </div>
                            </button>
                        </div>
                        
                        <div class="mt-8">
                            <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Stock Alerts</h4>
                            <div class="space-y-3">
                                ${products.filter(p => p.stock < 5).slice(0, 3).map(p => `
                                    <div class="flex items-center gap-3 p-2 border-b border-slate-50 last:border-0 text-sm">
                                        <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span class="flex-1 font-medium">${p.name}</span>
                                        <span class="text-slate-500">${p.stock} left</span>
                                    </div>
                                `).join('') || '<p class="text-slate-400 text-sm italic">All stock levels ok.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        statCard(title, value, icon, colorClass) {
            return `
                <div class="bg-white p-7 rounded-3xl premium-shadow border border-slate-50 hover-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">${title}</p>
                            <h3 class="text-2xl font-black text-slate-800 tracking-tight">${value}</h3>
                        </div>
                        <div class="p-4 ${colorClass} rounded-2xl shadow-inner">
                            <i data-lucide="${icon}" class="w-6 h-6"></i>
                        </div>
                    </div>
                </div>
            `;
        },
        afterRender() {
            const ctx = document.getElementById('salesChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Sales Revenue',
                        data: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { display: false } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    },

    products: {
        render() {
            const products = DB.getProducts();
            return `
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div class="relative flex-1 max-w-md">
                        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                        <input type="text" id="prod-search" placeholder="Search products by name or barcode..." class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                    </div>
                    <button onclick="Views.products.showAddModal()" class="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
                        <i data-lucide="plus" class="w-5 h-5"></i>
                        <span>Add Product</span>
                    </button>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price (Sell)</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                                    <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="product-list" class="divide-y divide-slate-50">
                                ${products.length ? products.map(p => this.row(p)).join('') : '<tr><td colspan="5" class="p-12 text-center text-slate-400">No products found. Start by adding one.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        },
        row(p) {
            const stockColor = p.stock < 10 ? 'text-rose-600 font-bold' : 'text-slate-600';
            return `
                <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex flex-col">
                            <span class="font-bold text-slate-800">${p.name}</span>
                            <span class="text-xs text-slate-400 font-mono">${p.barcode || 'NO-BARCODE'}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4"><span class="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">${p.category || 'General'}</span></td>
                    <td class="px-6 py-4 font-semibold text-slate-700">${DB.state.settings.currency} ${p.sellingPrice}</td>
                    <td class="px-6 py-4"><span class="${stockColor}">${p.stock}</span></td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center gap-2">
                            <button title="Download Barcode" onclick="Views.products.download('${p.barcode}', '${p.name}')" class="p-2 hover:bg-white border rounded-lg transition-all text-slate-400 hover:text-indigo-600">
                                <i data-lucide="download" class="w-4 h-4"></i>
                            </button>
                            <button onclick="Views.products.showEditModal('${p.id}')" class="p-2 hover:bg-white border hover:border-indigo-400 rounded-lg transition-all text-slate-400 hover:text-indigo-600">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button onclick="Views.products.delete('${p.id}')" class="p-2 hover:bg-white border hover:border-rose-400 rounded-lg transition-all text-slate-400 hover:text-rose-600">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        },
        download(barcode, name) {
            if (!barcode) {
                UI.notify('No barcode assigned to this product.', 'error');
                return;
            }
            try {
                // Create a hidden canvas
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, barcode, {
                    format: "CODE128",
                    lineColor: "#000",
                    width: 2,
                    height: 50,
                    displayValue: true
                });

                // Download image
                const link = document.createElement('a');
                link.download = `barcode-${barcode}-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
                UI.notify('Barcode image downloaded.');
            } catch (err) {
                UI.notify('Error generating barcode.', 'error');
                console.error(err);
            }
        },
        showAddModal() {
            UI.showModal('Add New Product', `
                <form id="product-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-sm font-bold text-slate-700 mb-1">Product Name*</label>
                            <input type="text" name="name" required class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Barcode Number</label>
                            <input type="text" name="barcode" placeholder="Enter barcode..." class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Category</label>
                            <select name="category" class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                <option value="Mens">Mens</option>
                                <option value="Womens">Womens</option>
                                <option value="Kids">Kids</option>
                                <option value="Accessories">Accessories</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Buy Price</label>
                            <input type="number" name="buyingPrice" step="0.01" class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Sell Price*</label>
                            <input type="number" name="sellingPrice" step="0.01" required class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Size</label>
                            <input type="text" name="size" placeholder="M, L, XL..." class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Color</label>
                            <input type="text" name="color" class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-bold text-slate-700 mb-1">Initial Stock*</label>
                            <input type="number" name="stock" value="0" required class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                    </div>
                </form>
            `);

            document.getElementById('modal-submit').onclick = () => {
                const form = document.getElementById('product-form');
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    const product = Object.fromEntries(formData.entries());
                    DB.addProduct(product);
                    UI.hideModal();
                    UI.notify('Product added successfully!');
                    Router.navigate('products');
                } else {
                    form.reportValidity();
                }
            };
        },
        showEditModal(id) {
            const p = DB.getProducts().find(prod => prod.id === id);
            if (!p) return;

            UI.showModal('Edit Product', `
                <form id="edit-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-sm font-bold text-slate-700 mb-1">Product Name*</label>
                            <input type="text" name="name" value="${p.name}" required class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Barcode</label>
                            <input type="text" name="barcode" value="${p.barcode || ''}" class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Category</label>
                            <select name="category" class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                <option value="Mens" ${p.category === 'Mens' ? 'selected' : ''}>Mens</option>
                                <option value="Womens" ${p.category === 'Womens' ? 'selected' : ''}>Womens</option>
                                <option value="Kids" ${p.category === 'Kids' ? 'selected' : ''}>Kids</option>
                                <option value="Accessories" ${p.category === 'Accessories' ? 'selected' : ''}>Accessories</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Buy Price</label>
                            <input type="number" name="buyingPrice" step="0.01" value="${p.buyingPrice || ''}" class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Sell Price*</label>
                            <input type="number" name="sellingPrice" step="0.01" value="${p.sellingPrice}" required class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-1">Update Stock*</label>
                            <input type="number" name="stock" value="${p.stock}" required class="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                        </div>
                    </div>
                </form>
            `);

            document.getElementById('modal-submit').onclick = () => {
                const form = document.getElementById('edit-form');
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    const updatedProduct = Object.fromEntries(formData.entries());
                    DB.updateProduct(id, updatedProduct);
                    UI.hideModal();
                    UI.notify('Product updated.');
                    Router.navigate('products');
                } else {
                    form.reportValidity();
                }
            };
        },
        delete(id) {
            if (confirm('Are you sure you want to delete this product?')) {
                DB.deleteProduct(id);
                UI.notify('Product deleted.');
                Router.navigate('products');
            }
        }
    },

    billing: {
        cart: [],
        discount: 0,
        
        render() {
            // Cart and discount state is preserved across navigation
            return `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                    <!-- Left: Search & Items -->
                    <div class="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div class="relative">
                                <i data-lucide="scan" class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500"></i>
                                <input type="text" id="bill-search" placeholder="Enter barcode or product name..." class="w-full pl-14 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-lg font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner">
                            </div>
                            <div id="quick-results" class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                                <!-- Fast picks -->
                            </div>
                        </div>

                        <div class="bg-white flex-1 rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div class="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 class="font-bold text-lg">Current Cart</h3>
                                <button onclick="Views.billing.clearCart()" class="text-sm font-bold text-rose-500 hover:text-rose-600">Clear All</button>
                            </div>
                            <div id="cart-items" class="flex-1 overflow-y-auto p-6 space-y-4">
                                <div class="flex flex-col items-center justify-center h-full text-slate-300">
                                    <i data-lucide="shopping-cart" class="w-16 h-16 mb-4"></i>
                                    <p class="font-bold text-xl uppercase tracking-widest">Cart is empty</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Summary & Checkout -->
                    <div class="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col">
                        <h3 class="font-bold text-xl mb-8 flex items-center gap-2">
                            <i data-lucide="receipt" class="w-6 h-6 text-indigo-400"></i>
                            Order Summary
                        </h3>
                        
                        <div class="space-y-6 flex-1">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-400">Subtotal</span>
                                <span id="bill-subtotal" class="font-bold">0.00</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-400">Discount</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-slate-500">${DB.state.settings.currency}</span>
                                    <input type="number" id="bill-discount" value="0" oninput="Views.billing.updateTotals()" class="w-20 bg-slate-800 border-none rounded-lg px-2 py-1 text-right focus:ring-1 focus:ring-indigo-500 outline-none">
                                </div>
                            </div>
                            <div class="pt-6 border-t border-white/10">
                                <div class="flex justify-between items-end mb-2">
                                    <span class="text-slate-400">Grand Total</span>
                                    <span class="text-indigo-400 text-xs font-bold font-mono">LKR</span>
                                </div>
                                <div id="bill-total" class="text-5xl font-black text-white">0.00</div>
                            </div>
                        </div>

                        <div class="mt-8 space-y-4">
                            <div class="grid grid-cols-2 gap-3">
                                <button class="p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors flex flex-col items-center gap-2 border-2 border-transparent focus:border-indigo-500 group">
                                    <i data-lucide="banknote" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                                    <span class="text-xs font-bold uppercase">Cash</span>
                                </button>
                                <button class="p-4 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors flex flex-col items-center gap-2 border-2 border-transparent focus:border-indigo-500 group">
                                    <i data-lucide="credit-card" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                                    <span class="text-xs font-bold uppercase">Card</span>
                                </button>
                            </div>
                            <button onclick="Views.billing.checkout()" class="w-full py-5 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-3">
                                <i data-lucide="check-circle" class="w-6 h-6"></i>
                                Complete Sale
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },
        afterRender() {
            const searchInput = document.getElementById('bill-search');
            searchInput.focus();
            
            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                const products = DB.getProducts();
                
                // Fast Barcode Direct Add
                const exactMatch = products.find(p => p.barcode === term);
                if (exactMatch) {
                    this.addToCart(exactMatch);
                    e.target.value = '';
                    return;
                }

                const results = products.filter(p => 
                    p.name.toLowerCase().includes(term) || 
                    p.barcode?.includes(term) ||
                    p.category?.toLowerCase().includes(term)
                ).slice(0, 6);
                
                this.renderQuickResults(results);
            };

            // Enter key on search
            searchInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    const firstResult = document.querySelector('#quick-results button');
                    if (firstResult) firstResult.click();
                }
            };

            this.renderQuickResults(DB.getProducts().slice(0, 6));

            // Remote Scanner Listener
            if (!this.remoteScannerActive) {
                this.remoteScannerActive = true;
                this.listenForRemoteScan();
            }
        },

        remoteScannerActive: false,
        listenForRemoteScan() {
            if (!SocketSync.socket) {
                if (!SocketSync.init()) return;
            }

            // Only listen if we are on the billing page
            if (Router.currentPath !== 'billing') {
                this.remoteScannerActive = false;
                return;
            }

            if (this.remoteScannerActive) return;
            this.remoteScannerActive = true;

            SocketSync.socket.on('remote_scan', (data) => {
                if (data && data.barcode) {
                    const product = DB.getProducts().find(p => p.barcode === data.barcode);
                    if (product) {
                        this.addToCart(product);
                        UI.notify(`Remote Scan: ${product.name} added!`);
                    } else {
                        UI.notify(`Remote Scan: Product not found (${data.barcode})`, 'error');
                    }
                }
            });
        },

        renderQuickResults(products) {
            const container = document.getElementById('quick-results');
            container.innerHTML = products.map(p => `
                <button onclick="Views.billing.addToCartByID('${p.id}')" class="p-3 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 rounded-xl text-left transition-all group">
                    <p class="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-indigo-600">${p.name}</p>
                    <p class="text-[10px] text-slate-400">${DB.state.settings.currency} ${p.sellingPrice}</p>
                </button>
            `).join('');
        },

        addToCartByID(id) {
            const product = DB.getProducts().find(p => p.id === id);
            if (product) this.addToCart(product);
        },

        addToCart(product) {
            if (product.stock <= 0) {
                UI.notify('This item is out of stock.', 'error');
                return;
            }

            const existing = this.cart.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    UI.notify('Cannot add more. Stock limit reached.', 'error');
                    return;
                }
                existing.quantity++;
            } else {
                this.cart.push({
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.sellingPrice),
                    quantity: 1,
                    stock: product.stock
                });
            }
            this.renderCart();
            document.getElementById('bill-search').value = '';
            UI.notify('Item added to cart.');
        },

        renderCart() {
            const container = document.getElementById('cart-items');
            if (this.cart.length === 0) {
                container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-slate-300">
                    <i data-lucide="shopping-cart" class="w-16 h-16 mb-4"></i>
                    <p class="font-bold text-xl uppercase tracking-widest">Cart is empty</p>
                </div>`;
            } else {
                container.innerHTML = this.cart.map((item, index) => `
                    <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl animate-fade-in border border-transparent hover:border-indigo-100 transition-colors">
                        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-500 font-bold border border-slate-100">${index + 1}</div>
                        <div class="flex-1">
                            <h4 class="font-bold text-slate-800 line-clamp-1">${item.name}</h4>
                            <p class="text-xs text-slate-500">${DB.state.settings.currency} ${item.price} each</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="Views.billing.updateQty('${item.id}', -1)" class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors"><i data-lucide="minus" class="w-4 h-4"></i></button>
                            <span class="font-bold text-slate-800 w-6 text-center">${item.quantity}</span>
                            <button onclick="Views.billing.updateQty('${item.id}', 1)" class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 transition-colors"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                        <div class="w-24 text-right">
                            <p class="font-bold text-slate-900">${DB.state.settings.currency} ${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <button onclick="Views.billing.removeFromCart('${item.id}')" class="p-2 text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                `).join('');
            }
            lucide.createIcons();
            this.updateTotals();
        },

        updateQty(id, delta) {
            const item = this.cart.find(i => i.id === id);
            if (item) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) {
                    this.removeFromCart(id);
                } else if (newQty > item.stock) {
                    UI.notify('Insufficient stock!', 'error');
                } else {
                    item.quantity = newQty;
                }
            }
            this.renderCart();
        },

        removeFromCart(id) {
            this.cart = this.cart.filter(item => item.id !== id);
            this.renderCart();
        },

        updateTotals() {
            const subtotal = this.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const discountInput = document.getElementById('bill-discount');
            const disc = parseFloat(discountInput?.value) || 0;
            const total = Math.max(0, subtotal - disc);
            
            document.getElementById('bill-subtotal').textContent = subtotal.toFixed(2);
            document.getElementById('bill-total').textContent = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        checkout() {
            if (this.cart.length === 0) {
                UI.notify('Cart is empty!', 'error');
                return;
            }

            const subtotal = this.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const disc = parseFloat(document.getElementById('bill-discount').value) || 0;
            const total = subtotal - disc;

            const sale = {
                items: JSON.parse(JSON.stringify(this.cart)),
                subtotal,
                discount: disc,
                total
            };

            const completedSale = DB.addSale(sale);
            UI.notify('Sale completed successfully!');
            this.printReceipt(completedSale);
            this.clearCart();
        },

        clearCart() {
            this.cart = [];
            this.renderCart();
            document.getElementById('bill-discount').value = 0;
            document.getElementById('bill-search').focus();
        },

        printReceipt(sale) {
            const settings = DB.state.settings;
            const dateStr = new Date(sale.timestamp).toLocaleString();
            
            const printContent = `
                <div style="font-family: 'Courier New', monospace; width: 58mm; padding: 2mm; color: black; background: white; font-size: 10px; line-height: 1.2;">
                    <div style="text-align: center; margin-bottom: 4mm;">
                        <h2 style="margin: 0; font-size: 14px; text-transform: uppercase;">${settings.shopName}</h2>
                        <p style="margin: 1mm 0;">${settings.address}</p>
                        <p style="margin: 0;">Tel: ${settings.phone}</p>
                    </div>
                    
                    <div style="border-top: 1px dashed #000; padding-top: 2mm; margin-bottom: 2mm;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Invoice: ${sale.invoiceNo}</span>
                        </div>
                        <div>Date: ${dateStr}</div>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 2mm;">
                        <thead style="border-bottom: 1px dashed #000;">
                            <tr>
                                <th style="text-align: left; padding: 1mm 0;">Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map(item => `
                                <tr>
                                    <td style="padding: 1mm 0; max-width: 25mm; word-wrap: break-word;">${item.name}</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td style="text-align: right;">${(item.quantity * item.price).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="border-top: 1px dashed #000; padding-top: 2mm; margin-top: 2mm;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                            <span>Subtotal:</span>
                            <span>${sale.subtotal.toFixed(2)}</span>
                        </div>
                        ${sale.discount > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                            <span>Discount:</span>
                            <span>-${sale.discount.toFixed(2)}</span>
                        </div>` : ''}
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 1mm; border-top: 1px solid #000; padding-top: 1mm;">
                            <span>Total:</span>
                            <span>${DB.state.settings.currency} ${sale.total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 5mm; border-top: 1px dashed #000; padding-top: 3mm;">
                        <p style="margin: 0;">${settings.footerText}</p>
                        <p style="margin-top: 2mm; font-size: 8px;">POSBIT - Empowering Small Business</p>
                    </div>
                    
                    <!-- Margin for cutter -->
                    <div style="height: 10mm;"></div>
                </div>
            `;

            const printArea = document.getElementById('receipt-print-area');
            printArea.innerHTML = printContent;
            
            // Wait slightly for content to render then print
            setTimeout(() => {
                window.print();
            }, 500);
        }
    },

    sales: {
        render() {
            const sales = [...DB.getSales()].reverse();
            return `
                <div class="flex items-center justify-between mb-8">
                    <h3 class="font-bold text-lg">Sales History</h3>
                    <div class="flex gap-2">
                        <input type="date" class="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                        <button class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-semibold text-slate-700">Export CSV</button>
                    </div>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b">
                            <tr>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500">Invoice #</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500">Date & Time</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500">Items</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500">Total</th>
                                <th class="px-6 py-4 text-xs font-bold text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${sales.length ? sales.map(s => `
                                <tr>
                                    <td class="px-6 py-4 font-bold text-indigo-600">${s.invoiceNo}</td>
                                    <td class="px-6 py-4 text-slate-600">${new Date(s.timestamp).toLocaleString()}</td>
                                    <td class="px-6 py-4 text-slate-500">${s.items.length} items</td>
                                    <td class="px-6 py-4 font-bold text-slate-800">${DB.state.settings.currency} ${s.total.toLocaleString()}</td>
                                    <td class="px-6 py-4 text-right">
                                        <button onclick="Views.sales.reprint('${s.id}')" class="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">Re-print</button>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="5" class="p-12 text-center text-slate-400">No sales recorded yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;
        },
        reprint(id) {
            const sale = DB.getSales().find(s => s.id === id);
            if (sale) Views.billing.printReceipt(sale);
        }
    },

    settings: {
        render() {
            const s = DB.getSettings();
            return `
                <div class="max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-xl mb-8">System Configuration</h3>
                    <form id="settings-form" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">Shop Name</label>
                                <input type="text" name="shopName" value="${s.shopName}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                <input type="text" name="phone" value="${s.phone}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-bold text-slate-700 mb-2">Address</label>
                                <textarea name="address" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">${s.address}</textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">Currency Symbol</label>
                                <input type="text" name="currency" value="${s.currency}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">Invoice Prefix</label>
                                <input type="text" name="invoicePrefix" value="${s.invoicePrefix}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-bold text-slate-700 mb-2">Receipt Footer Text</label>
                                <input type="text" name="footerText" value="${s.footerText}" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                            </div>
                        </div>
                        <div class="pt-6 border-t flex justify-end">
                            <button type="submit" class="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                Save Settings
                            </button>
                        </div>
                    </form>
                </div>
            `;
        },
        afterRender() {
            const form = document.getElementById('settings-form');
            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const settings = Object.fromEntries(formData.entries());
                DB.updateSettings(settings);
                UI.notify('Settings updated successfully!');
                
                // Update header UI
                document.getElementById('shop-name-display').textContent = settings.shopName;
            };
        }
    },

    reports: {
        render() {
            const sales = DB.getSales();
            const products = DB.getProducts();
            const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
            const totalSalesCount = sales.length;
            
            // Category wise sales
            const catSales = {};
            sales.forEach(s => {
                s.items.forEach(item => {
                    const p = products.find(prod => prod.id === item.id);
                    const cat = p ? p.category : 'General';
                    catSales[cat] = (catSales[cat] || 0) + (item.price * item.quantity);
                });
            });

            return `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                        <p class="text-indigo-100 text-sm font-bold uppercase mb-1">Lifetime Revenue</p>
                        <h3 class="text-3xl font-black">${DB.state.settings.currency} ${totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-slate-400 text-sm font-bold uppercase mb-1">Lifetime Invoices</p>
                        <h3 class="text-3xl font-black text-slate-800">${totalSalesCount}</h3>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-slate-400 text-sm font-bold uppercase mb-1">Avg. Ticket Size</p>
                        <h3 class="text-3xl font-black text-slate-800">${DB.state.settings.currency} ${(totalRevenue / (totalSalesCount || 1)).toFixed(2)}</h3>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <i data-lucide="pie-chart" class="w-5 h-5 text-indigo-500"></i>
                            Sales by Category
                        </h4>
                        <div class="space-y-4">
                            ${Object.entries(catSales).length ? Object.entries(catSales).map(([cat, val]) => `
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="font-bold text-slate-600">${cat}</span>
                                        <span class="font-mono text-slate-500">${DB.state.settings.currency} ${val.toLocaleString()}</span>
                                    </div>
                                    <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div class="bg-indigo-500 h-full" style="width: ${(val / totalRevenue * 100) || 0}%"></div>
                                    </div>
                                </div>
                            `).join('') : '<p class="text-slate-400 text-sm italic">No category data yet.</p>'}
                        </div>
                    </div>

                    <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h4 class="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <i data-lucide="trending-up" class="w-5 h-5 text-emerald-500"></i>
                            Recent Performance
                        </h4>
                        <canvas id="reportsChart" class="w-full h-48"></canvas>
                    </div>
                </div>
            `;
        },
        afterRender() {
            const ctx = document.getElementById('reportsChart')?.getContext('2d');
            if (ctx) {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Category Sales', 'Total Revenue'],
                        datasets: [{
                            data: [DB.getSales().length, DB.getProducts().length],
                            backgroundColor: ['#4f46e5', '#10b981'],
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { display: false }, x: { grid: { display: false } } }
                    }
                });
            }
        }
    }
};
