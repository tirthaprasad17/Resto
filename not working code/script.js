

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

// --- Auth Gatekeeper: Controls access and UI ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userRole = doc.data().role;
                sessionStorage.setItem('userRole', userRole); // Store role for redirect check

                if (userRole === 'admin' || userRole === 'waiter') {
                    // This is the corrected line
                    setupUIForRole(userRole); // Call the function with the user's role

                    renderMenuItems(); // Load data
                    renderOrders(); // Load data
                } else {
                    window.location.href = 'menu.html'; // Customer trying to access staff page
                }
            } else {
                // If user exists in Auth but not in Firestore, sign out
                auth.signOut();
            }
        });
    } else {
        sessionStorage.removeItem('userRole');
        window.location.href = 'login.html'; // No user logged in
    }
});

// --- THIS IS THE KEY FUNCTION FOR SEPARATING VIEWS ---
const setupUIForRole = (role) => {
    const staffPanel = document.getElementById('staff-panel-container');
    const menuManagementSection = document.getElementById('menu-management-section');
    const pageTitle = document.getElementById('page-title');
    
    // Create and add logout button
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.className = 'absolute top-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg shadow hover:bg-red-600 transition-colors';
    logoutButton.onclick = () => auth.signOut();
    document.body.appendChild(logoutButton);

    if (role === 'admin') {
        pageTitle.textContent = 'Admin Panel';
        menuManagementSection.classList.remove('menu-management-section'); // Show menu management
    } else if (role === 'waiter') {
        pageTitle.textContent = 'Waiter Panel - Order Queue';
        menuManagementSection.classList.add('menu-management-section'); // <<-- HIDE menu management
    }
    
    staffPanel.classList.remove('menu-management-section'); // Show the main panel content now that it's configured
};

// --- Your existing functions for menu and order management go below ---
// --- NO CHANGES ARE NEEDED IN THE FUNCTIONS THEMSELVES ---

const addItemForm = document.getElementById('add-item-form');
const menuItemsContainer = document.getElementById('menu-items-container');
const orderQueueContainer = document.getElementById('order-queue-container');

const renderMenuItems = () => { db.collection('menuItems').orderBy('category').onSnapshot((snapshot) => { let itemsHtml = ""; snapshot.forEach((doc) => { const item = doc.data(); const id = doc.id; const availabilityClass = item.available ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'; const availabilityText = item.available ? 'Set as Unavailable' : 'Set as Available'; itemsHtml += ` <div class="bg-white rounded-lg shadow-md p-4 flex flex-col border border-gray-200"> <img src="${item.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${item.name}" class="w-full h-40 object-cover rounded-md mb-4"> <div class="flex-grow"> <h3 class="text-xl font-semibold">${item.name}</h3> <p class="text-gray-500 mb-2">${item.category}</p> <p class="text-lg font-bold text-blue-600">$${item.price.toFixed(2)}</p> </div> <div class="mt-4 space-y-2"> <button data-id="${id}" class="toggle-availability w-full text-white p-2 rounded text-sm transition-colors ${availabilityClass}"> ${availabilityText} </button> <button data-id="${id}" class="update-price w-full bg-yellow-500 text-white p-2 rounded text-sm hover:bg-yellow-600 transition-colors"> Update Price </button> <button data-id="${id}" class="delete-item w-full bg-red-500 text-white p-2 rounded text-sm hover:bg-red-600 transition-colors"> Delete Item </button> </div> </div> `; }); menuItemsContainer.innerHTML = itemsHtml; }); };
menuItemsContainer.addEventListener('click', (e) => { const target = e.target; const id = target.dataset.id; if (!id) return; if (target.classList.contains('delete-item')) { if (confirm('Are you sure you want to delete this item?')) { db.collection('menuItems').doc(id).delete(); } } else if (target.classList.contains('update-price')) { const newPrice = prompt(`Enter the new price:`); if (newPrice && !isNaN(newPrice)) { db.collection('menuItems').doc(id).update({ price: parseFloat(newPrice) }); } else if (newPrice) { alert('Please enter a valid number.'); } } else if (target.classList.contains('toggle-availability')) { db.collection('menuItems').doc(id).get().then(doc => { if (doc.exists) { db.collection('menuItems').doc(id).update({ available: !doc.data().available }); } }); } });
addItemForm.addEventListener('submit', (e) => { e.preventDefault(); const name = document.getElementById('item-name').value; const category = document.getElementById('item-category').value; const price = parseFloat(document.getElementById('item-price').value); const imageUrl = document.getElementById('item-image').value; db.collection('menuItems').add({ name: name, category: category, price: price, imageUrl: imageUrl, available: true }).then(() => { addItemForm.reset(); }); });
const renderOrders = () => { db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => { let ordersHtml = ""; if (snapshot.empty) { ordersHtml = "<p class='text-gray-500'>No active orders.</p>"; } else { snapshot.forEach(doc => { const order = doc.data(); const id = doc.id; let itemsList = order.items.map(item => `<li class="text-sm">${item.name} (x${item.quantity})</li>`).join(''); let actionButtons = ''; if (order.status === 'Pending') { actionButtons = `<button data-id="${id}" data-status="Preparing" class="update-status-btn bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600">Mark as Preparing</button>`; } else if (order.status === 'Preparing') { actionButtons = `<button data-id="${id}" data-status="Delivered" class="update-status-btn bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600">Mark as Delivered</button>`; } else { actionButtons = `<button data-id="${id}" class="delete-order-btn bg-gray-400 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-500">Archive Order</button>`; } ordersHtml += ` <div class="border rounded-lg p-4 bg-gray-50"> <div class="flex justify-between items-center"> <span class="font-bold">Order ID: ...${id.slice(-6)}</span> <span class="font-semibold text-lg text-blue-600">$${order.total.toFixed(2)}</span> </div> <p class="text-sm text-gray-500">Status: <span class="font-bold">${order.status}</span></p> <ul class="list-disc list-inside my-2">${itemsList}</ul> <div class="mt-2 text-right"> ${actionButtons} </div> </div> `; }); } orderQueueContainer.innerHTML = ordersHtml; }); };
orderQueueContainer.addEventListener('click', e => { const target = e.target; const id = target.dataset.id; if (!id) return; if (target.classList.contains('update-status-btn')) { const newStatus = target.dataset.status; db.collection('orders').doc(id).update({ status: newStatus }); } else if (target.classList.contains('delete-order-btn')) { if (confirm('Are you sure you want to archive this delivered order?')) { db.collection('orders').doc(id).delete(); } } });