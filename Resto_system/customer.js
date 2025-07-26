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
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('page-content').classList.remove('hidden');
        renderMenu();
        renderCart();
        renderMyOrders(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

// --- DOM Elements ---
const menuContainer = document.getElementById('customer-menu-container');
const cartContainer = document.getElementById('cart-items-container');
const cartTotalEl = document.getElementById('cart-total');
const placeOrderBtn = document.getElementById('place-order-btn');
const logoutBtn = document.getElementById('logout-btn');
const paymentModal = document.getElementById('payment-modal');
const modalTotalEl = document.getElementById('modal-total');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
const myOrdersContainer = document.getElementById('my-orders-container');

let cart = [];

// --- Logout Button ---
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// ===================================================
// SECTION 1: MENU & CART FUNCTIONALITY
// ===================================================
const renderMenu = () => { db.collection('menuItems').where('available', '==', true).onSnapshot(snapshot => { if (snapshot.empty) { menuContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">The kitchen is currently not offering any items.</p>'; return; } let menuHtml = ""; snapshot.forEach(doc => { const item = { id: doc.id, ...doc.data() }; menuHtml += ` <div class="bg-white rounded-lg shadow-md p-4 flex flex-col transition transform hover:-translate-y-1"> <img src="${item.imageUrl || 'https://placehold.co/600x400/png'}" alt="${item.name}" class="w-full h-40 object-cover rounded-md mb-4"> <div class="flex-grow"> <h3 class="text-xl font-semibold">${item.name}</h3> <p class="text-gray-500">${item.category}</p> <p class="text-lg font-bold text-blue-600 mt-2">$${item.price.toFixed(2)}</p> </div> <button data-id="${item.id}" class="add-to-cart-btn mt-4 w-full bg-blue-500 text-white p-2 rounded-lg font-bold hover:bg-blue-600"> Add to Cart </button> </div> `; }); menuContainer.innerHTML = menuHtml; }); };
const renderCart = () => { if (cart.length === 0) { cartContainer.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>'; placeOrderBtn.disabled = true; } else { let cartHtml = ""; cart.forEach((cartItem, index) => { cartHtml += ` <div class="flex justify-between items-center text-sm"> <span>${cartItem.name} (x${cartItem.quantity})</span> <div class="flex items-center gap-2"> <span class="font-semibold">$${(cartItem.price * cartItem.quantity).toFixed(2)}</span> <button data-index="${index}" class="remove-from-cart-btn text-red-500 font-bold hover:text-red-700">X</button> </div> </div> `; }); cartContainer.innerHTML = cartHtml; placeOrderBtn.disabled = false; } const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); cartTotalEl.textContent = `$${total.toFixed(2)}`; };
const addToCart = (itemId) => { db.collection('menuItems').doc(itemId).get().then(doc => { if (!doc.exists) return; const item = { id: doc.id, ...doc.data() }; const existingItem = cart.find(cartItem => cartItem.id === itemId); if (existingItem) { existingItem.quantity++; } else { cart.push({ ...item, quantity: 1 }); } renderCart(); }); };
const removeFromCart = (cartIndex) => { cart.splice(cartIndex, 1); renderCart(); };
const openPaymentModal = () => { if (cart.length === 0) return; const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); modalTotalEl.textContent = `$${total.toFixed(2)}`; paymentModal.classList.remove('hidden'); };
const closePaymentModal = () => { paymentModal.classList.add('hidden'); };
const finalizeOrder = () => { const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); const userId = auth.currentUser.uid; db.collection('orders').add({ userId: userId, items: cart, total: total, status: 'Pending', paymentStatus: 'Paid', createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { alert(`Payment successful! Your order has been placed. You can track it below.`); cart = []; renderCart(); closePaymentModal(); }).catch(error => { console.error("Error placing order: ", error); alert("There was an error processing your payment."); }); };
menuContainer.addEventListener('click', e => { if (e.target.classList.contains('add-to-cart-btn')) addToCart(e.target.dataset.id); });
cartContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-from-cart-btn')) removeFromCart(e.target.dataset.index); });
placeOrderBtn.addEventListener('click', openPaymentModal);
confirmPaymentBtn.addEventListener('click', finalizeOrder);
cancelPaymentBtn.addEventListener('click', closePaymentModal);

// ===================================================
// SECTION 2: LIVE ORDER TRACKING
// ===================================================
const renderMyOrders = (userId) => {
    db.collection('orders').where('userId', '==', userId).orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        if (snapshot.empty) {
            myOrdersContainer.innerHTML = '<p class="text-center text-gray-500 py-4">You have not placed any orders yet.</p>';
            return;
        }
        let ordersHtml = "";
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
            let itemsList = order.items.map(item => `<li class="text-sm text-gray-600">${item.name} (x${item.quantity})</li>`).join('');
            ordersHtml += `
                <div class="border rounded-lg p-4 bg-white shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="font-bold text-gray-800">Order ID: ...${id.slice(-6)}</p>
                            <p class="text-sm text-gray-500">${new Date(order.createdAt.seconds * 1000).toLocaleString()}</p>
                        </div>
                        <p class="font-extrabold text-xl text-blue-600">$${order.total.toFixed(2)}</p>
                    </div>
                    <!-- Status Bar -->
                    <div class="flex items-center w-full mb-4">
                        <div class="flex-1 text-center"><div class="w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center ${pendingClass}">✓</div><p class="text-xs mt-1 font-semibold">Pending</p></div>
                        <div class="w-full h-1 flex-auto ${line1Class}"></div>
                        <div class="flex-1 text-center"><div class="w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center ${preparingClass}">🍳</div><p class="text-xs mt-1 font-semibold">Preparing</p></div>
                        <div class="w-full h-1 flex-auto ${line2Class}"></div>
                        <div class="flex-1 text-center"><div class="w-10 h-10 mx-auto rounded-full text-lg flex items-center justify-center ${deliveredClass}">🎉</div><p class="text-xs mt-1 font-semibold">Delivered</p></div>
                    </div>
                    <details class="cursor-pointer"><summary class="text-sm font-semibold text-gray-600">View Details</summary><ul class="list-disc list-inside mt-2 pl-4">${itemsList}</ul></details>
                </div>
            `;
        });
        myOrdersContainer.innerHTML = ordersHtml;
    });
};
