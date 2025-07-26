// ❗️ PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE (same as in script.js)
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
const db = firebase.firestore();

// --- DOM Elements ---
const menuContainer = document.getElementById('customer-menu-container');
const cartContainer = document.getElementById('cart-items-container');
const cartTotalEl = document.getElementById('cart-total');
const placeOrderBtn = document.getElementById('place-order-btn');

// Modal Elements
const paymentModal = document.getElementById('payment-modal');
const modalTotalEl = document.getElementById('modal-total');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const cancelPaymentBtn = document.getElementById('cancel-payment-btn');

// Local cart state
let cart = [];

// --- RENDER MENU ITEMS ---
const renderMenu = () => {
    db.collection('menuItems').where('available', '==', true).onSnapshot(snapshot => {
        let menuHtml = "";
        snapshot.forEach(doc => {
            const item = { id: doc.id, ...doc.data() };
            menuHtml += `
                <div class="bg-white rounded-lg shadow-md p-4 flex flex-col">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${item.name}" class="w-full h-40 object-cover rounded-md mb-4">
                    <div class="flex-grow">
                        <h3 class="text-xl font-semibold">${item.name}</h3>
                        <p class="text-gray-500">${item.category}</p>
                        <p class="text-lg font-bold text-blue-600 mt-2">$${item.price.toFixed(2)}</p>
                    </div>
                    <button data-id="${item.id}" class="add-to-cart-btn mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors">
                        Add to Cart
                    </button>
                </div>
            `;
        });
        menuContainer.innerHTML = menuHtml;
    });
};

// --- RENDER CART & UPDATE TOTAL ---
const renderCart = () => {
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
        placeOrderBtn.disabled = true;
    } else {
        let cartHtml = "";
        cart.forEach((cartItem, index) => {
            cartHtml += `
                <div class="flex justify-between items-center text-sm">
                    <span>${cartItem.name} (x${cartItem.quantity})</span>
                    <span class="font-semibold">$${(cartItem.price * cartItem.quantity).toFixed(2)}</span>
                    <button data-index="${index}" class="remove-from-cart-btn text-red-500 font-bold ml-2">X</button>
                </div>
            `;
        });
        cartContainer.innerHTML = cartHtml;
        placeOrderBtn.disabled = false;
    }
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalEl.textContent = `$${total.toFixed(2)}`;
};

// --- CART ACTIONS ---
const addToCart = (itemId) => {
    db.collection('menuItems').doc(itemId).get().then(doc => {
        if (!doc.exists) return;
        const item = { id: doc.id, ...doc.data() };
        const existingItem = cart.find(cartItem => cartItem.id === itemId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        renderCart();
    });
};

const removeFromCart = (cartIndex) => {
    cart.splice(cartIndex, 1);
    renderCart();
};

// --- PAYMENT & ORDER LOGIC ---
const openPaymentModal = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    modalTotalEl.textContent = `$${total.toFixed(2)}`;
    paymentModal.classList.remove('hidden');
};

const closePaymentModal = () => {
    paymentModal.classList.add('hidden');
};

const finalizeOrder = () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Add the order to Firestore with a 'Paid' status
    db.collection('orders').add({
        items: cart,
        total: total,
        status: 'Pending',
        paymentStatus: 'Paid', // New field for payment simulation
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(docRef => {
        alert(`Payment successful! Your order ID is ${docRef.id}`);
        cart = [];
        renderCart();
        closePaymentModal();
    })
    .catch(error => {
        console.error("Error placing order: ", error);
        alert("There was an error processing your payment. Please try again.");
    });
};

// --- EVENT LISTENERS ---
menuContainer.addEventListener('click', e => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        addToCart(e.target.dataset.id);
    }
});

cartContainer.addEventListener('click', e => {
    if (e.target.classList.contains('remove-from-cart-btn')) {
        removeFromCart(e.target.dataset.index);
    }
});

// Update "Place Order" button to open the modal
placeOrderBtn.addEventListener('click', openPaymentModal);

// Modal button listeners
confirmPaymentBtn.addEventListener('click', finalizeOrder);
cancelPaymentBtn.addEventListener('click', closePaymentModal);

// --- INITIAL LOAD ---
renderMenu();
renderCart();