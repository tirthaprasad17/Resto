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
        // Check the user's role
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && (doc.data().role === 'waiter' || doc.data().role === 'admin')) {
                // If user is a waiter or admin, show the page
                document.getElementById('page-content').classList.remove('hidden');
                renderOrders();
            } else {
                // If user is not a waiter/admin, redirect them away
                auth.signOut(); // Sign them out for security
                window.location.href = 'login.html';
            }
        });
    } else {
        window.location.href = 'login.html';
    }
});

// --- DOM Elements ---
const orderQueueContainer = document.getElementById('order-queue-container');
const logoutBtn = document.getElementById('logout-btn');

// --- Logout ---
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// --- Render Orders ---
const renderOrders = () => {
    db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        if (snapshot.empty) {
            orderQueueContainer.innerHTML = "<p class='text-gray-500 text-center py-8'>No active orders.</p>";
            return;
        }
        let ordersHtml = "";
        snapshot.forEach(doc => {
            const order = doc.data();
            const id = doc.id;
            let itemsList = order.items.map(item => `<li class="text-sm">${item.name} (x${item.quantity})</li>`).join('');

            let actionButtons = '';
            if (order.status === 'Pending') {
                actionButtons = `<button data-id="${id}" data-status="Preparing" class="update-status-btn bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Mark as Preparing</button>`;
            } else if (order.status === 'Preparing') {
                actionButtons = `<button data-id="${id}" data-status="Delivered" class="update-status-btn bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600">Mark as Delivered</button>`;
            } else {
                actionButtons = `<button data-id="${id}" class="delete-order-btn bg-gray-400 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-500">Archive Order</button>`;
            }

            ordersHtml += `
                <div class="border rounded-lg p-4 bg-gray-50 transition-shadow hover:shadow-md">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-gray-700">Order ID: ...${id.slice(-6)}</span>
                        <span class="font-semibold text-lg text-blue-600">$${order.total.toFixed(2)}</span>
                    </div>
                    <p class="text-sm text-gray-500">Status: <span class="font-bold">${order.status}</span></p>
                    <ul class="list-disc list-inside my-2 pl-2">${itemsList}</ul>
                    <div class="mt-2 text-right">
                        ${actionButtons}
                    </div>
                </div>
            `;
        });
        orderQueueContainer.innerHTML = ordersHtml;
    });
};

// --- Event Listener for Order Actions ---
orderQueueContainer.addEventListener('click', e => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('update-status-btn')) {
        const newStatus = target.dataset.status;
        db.collection('orders').doc(id).update({ status: newStatus });
    } else if (target.classList.contains('delete-order-btn')) {
        if (confirm('Are you sure you want to archive this delivered order?')) {
            db.collection('orders').doc(id).delete();
        }
    }
});
