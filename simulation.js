// simulation.js
let db;
let currentUser = null;

const dbName = "HomeSecurityDB";
const userStoreName = "users";
const eventStoreName = "events";
const deviceStoreName = "devices";

// Initialize the database
const request = indexedDB.open(dbName, 1);

request.onerror = function(event) {
    console.error("Database error: " + event.target.error);
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Database opened successfully");
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const userStore = db.createObjectStore(userStoreName, { keyPath: "username" });
    userStore.createIndex("accessLevel", "accessLevel", { unique: false });

    const eventStore = db.createObjectStore(eventStoreName, { keyPath: "id", autoIncrement: true });
    eventStore.createIndex("timestamp", "timestamp", { unique: false });

    const deviceStore = db.createObjectStore(deviceStoreName, { keyPath: "id", autoIncrement: true });
    deviceStore.createIndex("type", "type", { unique: false });
};

function toggleAuth() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authToggle = document.getElementById('authToggle');

    if (loginForm.style.display !== 'none') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authToggle.innerHTML = 'Already have an account? <a href="#" onclick="toggleAuth()">Login here</a>';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authToggle.innerHTML = 'Dont have an account? <a href="#" onclick="toggleAuth()">Register here</a>';
    }
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const transaction = db.transaction([userStoreName], "readonly");
    const userStore = transaction.objectStore(userStoreName);
    const request = userStore.get(username);

    request.onerror = function(event) {
        console.error("Login error: " + event.target.error);
    };

    request.onsuccess = function(event) {
        const user = event.target.result;
        if (user && user.password === password) {
            currentUser = user;
            user.lastLogin = new Date().toISOString();
            updateUser(user);
            showOperationsPanel();
        } else {
            outputMessage('Invalid credentials. Please try again.');
        }
    };
}

function register() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const accessLevel = parseInt(document.getElementById('accessLevel').value);

    const user = {
        username: username,
        password: password,
        accessLevel: accessLevel,
        lastLogin: new Date().toISOString()
    };

    const transaction = db.transaction([userStoreName], "readwrite");
    const userStore = transaction.objectStore(userStoreName);
    const request = userStore.add(user);

    request.onerror = function(event) {
        console.error("Registration error: " + event.target.error);
        outputMessage("Error registering user. Username may already exist.");
    };

    request.onsuccess = function(event) {
        outputMessage(`User ${username} registered successfully with access level ${accessLevel}.`);
        toggleAuth();
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
    };
}

function showOperationsPanel() {
    document.querySelector('.simulation-container').style.display = 'none';
    document.getElementById('operationsPanel').style.display = 'block';
    document.getElementById('userInfo').innerHTML = `Logged in as: ${currentUser.username} (Access Level: ${currentUser.accessLevel})`;
    if (currentUser.accessLevel === 5) {
        document.getElementById('adminPanel').style.display = 'block';
    }
}

function addDevice() {
    const deviceType = document.getElementById('deviceType').value;
    const location = document.getElementById('deviceLocation').value;
    const status = document.getElementById('deviceStatus').value;

    const device = {
        type: deviceType,
        location: location,
        status: status
    };

    const transaction = db.transaction([deviceStoreName], "readwrite");
    const deviceStore = transaction.objectStore(deviceStoreName);
    const request = deviceStore.add(device);

    request.onerror = function(event) {
        console.error("Device addition error: " + event.target.error);
        outputMessage("Error adding device.");
    };

    request.onsuccess = function(event) {
        outputMessage(`Device added: Type - ${deviceType}, Location - ${location}, Status - ${status}`);
    };
}

function logEvent() {
    const deviceId = document.getElementById('eventDeviceId').value;
    const eventType = document.getElementById('eventType').value;
    
    const event = {
        deviceId: parseInt(deviceId),
        eventType: eventType,
        timestamp: new Date().toISOString(),
        username: currentUser.username
    };

    const transaction = db.transaction([eventStoreName], "readwrite");
    const eventStore = transaction.objectStore(eventStoreName);
    const request = eventStore.add(event);

    request.onerror = function(event) {
        console.error("Event logging error: " + event.target.error);
        outputMessage("Error logging event.");
    };

    request.onsuccess = function(event) {
        outputMessage(`Event logged: Device ID - ${deviceId}, Event Type - ${eventType}`);
    };
}

function viewRecentEvents() {
    const transaction = db.transaction([eventStoreName], "readonly");
    const eventStore = transaction.objectStore(eventStoreName);
    const index = eventStore.index("timestamp");
    
    const request = index.openCursor(null, "prev");
    let count = 0;
    let output = "Recent Events:\n";

    request.onerror = function(event) {
        console.error("Error fetching events: " + event.target.error);
        outputMessage("Error fetching recent events.");
    };

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor && count < 5) {
            const event = cursor.value;
            output += `${event.eventType} - Device: ${event.deviceId} - ${new Date(event.timestamp).toLocaleString()}\n`;
            count++;
            cursor.continue();
        } else {
            outputMessage(output);
        }
    };
}

function deleteUser() {
    const username = document.getElementById('deleteUser').value;
    if (username === currentUser.username) {
        outputMessage("You cannot delete your own account!");
        return;
    }

    const transaction = db.transaction([userStoreName], "readwrite");
    const userStore = transaction.objectStore(userStoreName);
    const request = userStore.delete(username);

    request.onerror = function(event) {
        console.error("Delete error: " + event.target.error);
        outputMessage("Error deleting user.");
    };

    request.onsuccess = function(event) {
        outputMessage(`User ${username} deleted successfully.`);
    };
}

function viewAllUsers() {
    const transaction = db.transaction([userStoreName], "readonly");
    const userStore = transaction.objectStore(userStoreName);
    const request = userStore.getAll();

    request.onerror = function(event) {
        console.error("Error fetching users: " + event.target.error);
        outputMessage("Error fetching user list.");
    };

    request.onsuccess = function(event) {
        const users = event.target.result;
        let output = "All Users:\n";
        users.forEach(user => {
            output += `${user.username} (Access Level: ${user.accessLevel})\n`;
        });
        outputMessage(output);
    };
}

function logout() {
    currentUser = null;
    document.querySelector('.simulation-container').style.display = 'block';
    document.getElementById('operationsPanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
    outputMessage('Logged out successfully.');
}

function outputMessage(message) {
    document.getElementById('output').textContent = message;
}