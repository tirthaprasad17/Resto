// ❗️ PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
const firebaseConfig = {
  apiKey: "AIzaSyAm6B7oSBlFR1uN9jOXEbSeARLJk_0_ho8",
  authDomain: "myrestaurantmenu-8f6fd.firebaseapp.com",
  projectId: "myrestaurantmenu-8f6fd",
  storageBucket: "myrestaurantmenu-8f6fd.firebasestorage.app",
  messagingSenderId: "100842702438",
  appId: "1:100842702438:web:f9baeaf4c6e49fa9310fa7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Auth Gatekeeper ---
// This function is the entry point. It checks for a logged-in user.
auth.onAuthStateChanged(user => {
    if (user) {
        // If a user is logged in, check their role in the database.
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role === 'admin') {
                // If the user is an admin, run the main app function.
                runAdminApp();
            } else {
                // If they are not an admin, sign them out and redirect to login.
                auth.signOut();
                window.location.href = 'login.html';
            }
        });
    } else {
        // If no user is logged in, redirect to login.
        window.location.href = 'login.html';
    }
});


// --- Main App Function ---
// This function only runs AFTER we have confirmed the user is an admin.
function runAdminApp() {
    console.log("Admin authenticated. Initializing dashboard...");

    // Unhide the main page content
    document.getElementById('page-content').classList.remove('hidden');

    // --- Select all DOM Elements safely ---
    const logoutBtn = document.getElementById('logout-btn');
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const addItemForm = document.getElementById('add-item-form');
    const menuItemsContainer = document.getElementById('menu-items-container');
    const orderQueueContainer = document.getElementById('order-queue-container');
    const adminMenuForOrderingContainer = document.getElementById('admin-menu-for-ordering');
    const adminCartContainer = document.getElementById('admin-cart-container');
    const adminCartTotalEl = document.getElementById('admin-cart-total');
    const adminPlaceOrderBtn = document.getElementById('admin-place-order-btn');

    let adminCart = [];

    // --- Attach all Event Listeners safely ---

    // Logout
    logoutBtn.addEventListener('click', () => auth.signOut());

    // Tab Switching
    tabs.forEach(clickedTab => {
        clickedTab.addEventListener('click', () => {
            tabs.forEach(tab => {
                tab.classList.remove('bg-blue-600', 'text-white');
                tab.classList.add('bg-gray-200', 'text-gray-600');
            });
            clickedTab.classList.add('bg-blue-600', 'text-white');
            clickedTab.classList.remove('bg-gray-200', 'text-gray-600');
            const targetContentId = `content-${clickedTab.id.split('-').slice(1).join('-')}`;
            tabContents.forEach(content => {
                content.classList.toggle('hidden', content.id !== targetContentId);
            });
        });
    });
    
    // --- Call all render functions to load data ---
    renderMenuForOrdering();
    renderMenuItemsForEditing();
    renderOrders();
    renderAdminCart();

    // ===================================================
    // SECTION 1: PLACE ORDER (for Admin) - WITH IMAGES
    // ===================================================
    function renderMenuForOrdering() {
        db.collection('menuItems').where('available', '==', true).onSnapshot(snapshot => {
            let menuHtml = "";
            snapshot.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                menuHtml += `
                    <div class="bg-gray-50 rounded-lg p-3 border flex flex-col">
                        <img src="${item.imageUrl || 'https://placehold.co/600x400/png'}" alt="${item.name}" class="w-full h-32 object-cover rounded-md mb-3">
                        <h4 class="font-semibold text-lg">${item.name}</h4>
                        <p class="text-gray-500 text-sm mb-2">${item.category}</p>
                        <p class="text-blue-600 font-bold mt-auto">$${item.price.toFixed(2)}</p>
                        <button data-id="${item.id}" class="add-to-admin-cart-btn mt-3 w-full bg-blue-500 text-white p-2 rounded-lg text-sm font-bold hover:bg-blue-600">Add</button>
                    </div>`;
            });
            adminMenuForOrderingContainer.innerHTML = menuHtml;
        });
    }
    function renderAdminCart() { if (adminCart.length === 0) { adminCartContainer.innerHTML = '<p class="text-gray-500">Cart is empty.</p>'; adminPlaceOrderBtn.disabled = true; } else { let cartHtml = ""; adminCart.forEach((cartItem, index) => { cartHtml += `<div class="flex justify-between items-center text-sm"><span>${cartItem.name} (x${cartItem.quantity})</span><button data-index="${index}" class="remove-from-admin-cart-btn text-red-500 font-bold">X</button></div>`; }); adminCartContainer.innerHTML = cartHtml; adminPlaceOrderBtn.disabled = false; } const total = adminCart.reduce((sum, item) => sum + (item.price * item.quantity), 0); adminCartTotalEl.textContent = `$${total.toFixed(2)}`;}
    adminMenuForOrderingContainer.addEventListener('click', e => { if (e.target.classList.contains('add-to-admin-cart-btn')) { const itemId = e.target.dataset.id; db.collection('menuItems').doc(itemId).get().then(doc => { const item = { id: doc.id, ...doc.data() }; const existingItem = adminCart.find(cartItem => cartItem.id === itemId); if (existingItem) existingItem.quantity++; else adminCart.push({ ...item, quantity: 1 }); renderAdminCart(); }); } });
    adminCartContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-from-admin-cart-btn')) { adminCart.splice(e.target.dataset.index, 1); renderAdminCart(); } });
    adminPlaceOrderBtn.addEventListener('click', () => { if (adminCart.length === 0) return; const total = adminCart.reduce((sum, item) => sum + (item.price * item.quantity), 0); db.collection('orders').add({ items: adminCart, total: total, status: 'Pending', paymentStatus: 'Paid (Admin Order)', createdAt: firebase.firestore.FieldValue.serverTimestamp(), placedBy: 'admin' }).then(() => { alert('Order sent to kitchen!'); adminCart = []; renderAdminCart(); }); });

    // ===================================================
    // SECTION 2: MENU MANAGEMENT
    // ===================================================
    addItemForm.addEventListener('submit', (e) => { e.preventDefault(); const name = document.getElementById('item-name').value; const category = document.getElementById('item-category').value; const price = parseFloat(document.getElementById('item-price').value); const imageUrl = document.getElementById('item-image').value; db.collection('menuItems').add({ name, category, price, imageUrl, available: true }).then(() => addItemForm.reset()).catch(err => console.error("Error adding item: ", err)); });
    function renderMenuItemsForEditing() { db.collection('menuItems').orderBy('category').onSnapshot(snapshot => { let itemsHtml = ""; snapshot.forEach(doc => { const item = doc.data(); const id = doc.id; const availabilityClass = item.available ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'; const availabilityText = item.available ? 'Set Unavailable' : 'Set Available'; itemsHtml += ` <div class="bg-gray-50 rounded-lg p-3 border"> <img src="${item.imageUrl || 'https://placehold.co/600x400/png'}" alt="${item.name}" class="w-full h-24 object-cover rounded-md mb-2"> <h4 class="font-semibold">${item.name}</h4> <p class="text-blue-600 font-bold">$${item.price.toFixed(2)}</p> <div class="mt-2 space-y-1"> <button data-id="${id}" class="toggle-availability w-full text-white p-1 rounded text-xs ${availabilityClass}">${availabilityText}</button> <button data-id="${id}" class="update-price w-full bg-yellow-500 text-white p-1 rounded text-xs">Update Price</button> <button data-id="${id}" class="delete-item w-full bg-red-500 text-white p-1 rounded text-xs">Delete</button> </div> </div>`; }); menuItemsContainer.innerHTML = itemsHtml; });}
    menuItemsContainer.addEventListener('click', (e) => { const target = e.target; const id = target.dataset.id; if (!id) return; if (target.classList.contains('delete-item')) { if (confirm('Delete this item?')) db.collection('menuItems').doc(id).delete(); } else if (target.classList.contains('update-price')) { const newPrice = prompt('Enter new price:'); if (newPrice && !isNaN(newPrice)) db.collection('menuItems').doc(id).update({ price: parseFloat(newPrice) }); } else if (target.classList.contains('toggle-availability')) { db.collection('menuItems').doc(id).get().then(doc => { if (doc.exists) db.collection('menuItems').doc(id).update({ available: !doc.data().available }); }); } });

    // ===================================================
    // SECTION 3: ORDER QUEUE - WITH LIVE TRACKING
    // ===================================================
    function renderOrders() {
        db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            let ordersHtml = "";
            if (snapshot.empty) {
                ordersHtml = "<p class='text-gray-500 text-center py-8'>No active orders.</p>";
            } else {
                snapshot.forEach(doc => {
                    const order = doc.data();
                    const id = doc.id;
                    const isPending = order.status === 'Pending';
                    const isPreparing = order.status === 'Preparing';
                    const isDelivered = order.status === 'Delivered';
                    const pendingClass = (isPending || isPreparing || isDelivered) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500';
                    const preparingClass = (isPreparing || isDelivered) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500';
                    const deliveredClass = isDelivered ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500';
                    const line1Class = (isPreparing || isDelivered) ? 'bg-blue-500' : 'bg-gray-200';
                    const line2Class = isDelivered ? 'bg-green-500' : 'bg-gray-200';
                    let itemsList = order.items.map(item => `<li class="text-sm">${item.name} (x${item.quantity})</li>`).join('');
                    let actionButtons = '';
                    if (isPending) {
                        actionButtons = `<button data-id="${id}" data-status="Preparing" class="update-status-btn bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Mark as Preparing</button>`;
                    } else if (isPreparing) {
                        actionButtons = `<button data-id="${id}" data-status="Delivered" class="update-status-btn bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600">Mark as Delivered</button>`;
                    } else {
                        actionButtons = `<button data-id="${id}" class="delete-order-btn bg-gray-400 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-500">Archive Order</button>`;
                    }
                    ordersHtml += `
                        <div class="border rounded-lg p-4 bg-gray-50">
                            <div class="flex justify-between items-center mb-3">
                                <span class="font-bold">Order ID: ...${id.slice(-6)}</span>
                                <span class="font-semibold text-lg text-blue-600">$${order.total.toFixed(2)}</span>
                            </div>
                            <!-- Visual Status Bar -->
                            <div class="flex items-center w-full mb-4">
                                <div class="flex-1 text-center">
                                    <div class="w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center ${pendingClass}">✓</div>
                                    <p class="text-xs mt-1 font-semibold">Pending</p>
                                </div>
                                <div class="w-full h-1 flex-auto ${line1Class}"></div>
                                <div class="flex-1 text-center">
                                    <div class="w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center ${preparingClass}">🍳</div>
                                    <p class="text-xs mt-1 font-semibold">Preparing</p>
                                </div>
                                <div class="w-full h-1 flex-auto ${line2Class}"></div>
                                <div class="flex-1 text-center">
                                    <div class="w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center ${deliveredClass}">🎉</div>
                                    <p class="text-xs mt-1 font-semibold">Delivered</p>
                                </div>
                            </div>
                            <details class="cursor-pointer text-sm mb-3">
                                <summary class="font-semibold text-gray-600">View Details</summary>
                                <ul class="list-disc list-inside mt-2 pl-4">${itemsList}</ul>
                            </details>
                            <div class="mt-2 text-right border-t pt-3">${actionButtons}</div>
                        </div>`;
                });
            }
            orderQueueContainer.innerHTML = ordersHtml;
        });
    }
    orderQueueContainer.addEventListener('click', e => { const target = e.target; const id = target.dataset.id; if (!id) return; if (target.classList.contains('update-status-btn')) { const newStatus = target.dataset.status; db.collection('orders').doc(id).update({ status: newStatus }); } else if (target.classList.contains('delete-order-btn')) { if (confirm('Archive this order? This also deletes it.')) db.collection('orders').doc(id).delete(); } });
}



orderQueueContainer.addEventListener('click', e => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;
    if (target.classList.contains('update-status-btn')) {
        const newStatus = target.dataset.status;
        db.collection('orders').doc(id).update({ status: newStatus });
    } else if (target.classList.contains('delete-order-btn')) {
        if (confirm('Archive this order?')) db.collection('orders').doc(id).delete();
    }
});
