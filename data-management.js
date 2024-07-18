// data-management.js
let db;

const dbName = "HomeSecurityDB";
const userStoreName = "users";

// Initialize the database connection
const request = indexedDB.open(dbName, 1);

request.onerror = function(event) {
    console.error("Database error: " + event.target.error);
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Database opened successfully");
    loadUserData();
};

function loadUserData() {
    const transaction = db.transaction([userStoreName], "readonly");
    const userStore = transaction.objectStore(userStoreName);
    const request = userStore.openCursor();
    const userTableBody = document.getElementById('userTableBody');
    userTableBody.innerHTML = '';

    request.onerror = function(event) {
        console.error("Error fetching users: " + event.target.error);
    };

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const user = cursor.value;
            const row = userTableBody.insertRow();
            
            row.insertCell(0).textContent = user.username;
            row.insertCell(1).textContent = user.accessLevel;
            row.insertCell(2).textContent = new Date(user.lastLogin).toLocaleString();
            
            const actionsCell = row.insertCell(3);
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'edit-btn';
            editBtn.onclick = function() { editUser(user.username); };
            actionsCell.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = function() { deleteUser(user.username); };
            actionsCell.appendChild(deleteBtn);

            cursor.continue();
        }
    };
}

function editUser(username) {
    const transaction = db.transaction([userStoreName], "readonly");
    const userStore = transaction.objectStore(userStoreName);
    const request = userStore.get(username);

    request.onerror = function(event) {
        console.error("Error fetching user: " + event.target.error);
    };

    request.onsuccess = function(event) {
        const user = event.target.result;
        const newAccessLevel = prompt(`Enter new access level for ${username}:`, user.accessLevel);
        
        if (newAccessLevel !== null) {
            user.accessLevel = parseInt(newAccessLevel);
            updateUser(user);
        }
    };
}

function updateUser(user) {
    const transaction = db.transaction([userStoreName], "readwrite");
    const userStore = transaction.objectStore(userStoreName);
    const request = userStore.put(user);

    request.onerror = function(event) {
        console.error("Update error: " + event.target.error);
    };

    request.onsuccess = function(event) {
        console.log("User updated successfully");
        loadUserData();
    };
}

function deleteUser(username) {
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
        const transaction = db.transaction([userStoreName], "readwrite");
        const userStore = transaction.objectStore(userStoreName);
        const request = userStore.delete(username);

        request.onerror = function(event) {
            console.error("Delete error: " + event.target.error);
        };

        request.onsuccess = function(event) {
            console.log("User deleted successfully");
            loadUserData();
        };
    }
}

// Initial load of user data
document.addEventListener('DOMContentLoaded', function() {
    // The loadUserData function will be called once the database is successfully opened
});