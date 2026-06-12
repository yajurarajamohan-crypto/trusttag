// =============================================
// TrustTag Registration & QR Code System
// =============================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
});

// =============================================
// User Session Management
// =============================================

function checkUserSession() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        const user = JSON.parse(currentUser);
        showDashboard(user);
    } else {
        showLoginForm();
    }
}

function showLoginForm() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('registrationSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

function showRegistrationForm() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registrationSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

function showDashboard(user) {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registrationSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    
    // Populate user info
    document.getElementById('userName').textContent = user.name.split(' ')[0];
    document.getElementById('userRole').textContent = `Role: ${formatRole(user.role)}`;
    document.getElementById('displayName').textContent = user.name;
    document.getElementById('displayEmail').textContent = user.email;
    document.getElementById('displayPhone').textContent = user.phone;
    document.getElementById('displayRole').textContent = formatRole(user.role);
    document.getElementById('displayId').textContent = user.id;
    document.getElementById('joinDate').textContent = formatDate(user.createdAt);
    document.getElementById('qrScans').textContent = user.qrScans || 0;
    document.getElementById('verifications').textContent = user.verifications || 0;
    
    // Display QR Code
    displayQRCode(user);
}

// =============================================
// Authentication Functions
// =============================================

function toggleForms() {
    const loginSection = document.getElementById('loginSection');
    const registrationSection = document.getElementById('registrationSection');
    
    if (loginSection.classList.contains('hidden')) {
        showLoginForm();
    } else {
        showRegistrationForm();
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('trusttagUsers') || '[]');
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showDashboard(user);
        showAlert('Login successful!', 'success');
        document.getElementById('loginForm').reset();
    } else {
        showAlert('Invalid email or password', 'error');
    }
}

function handleRegistration(event) {
    event.preventDefault();
    
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('userRole').value;
    
    // Validation
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('trusttagUsers') || '[]');
    if (users.find(u => u.email === email)) {
        showAlert('Email already registered', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: generateUserId(),
        name: name,
        email: email,
        phone: phone,
        password: password,
        role: role,
        createdAt: new Date().toISOString(),
        qrCode: null,
        qrScans: 0,
        verifications: 0
    };
    
    // Save user
    users.push(newUser);
    localStorage.setItem('trusttagUsers', JSON.stringify(users));
    
    // Set as current user
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    showAlert('Registration successful! Welcome to TrustTag', 'success');
    document.getElementById('registrationForm').reset();
    showDashboard(newUser);
}

function logout() {
    localStorage.removeItem('currentUser');
    showLoginForm();
    showAlert('Logged out successfully', 'info');
}

// =============================================
// QR Code Generation
// =============================================

function displayQRCode(user) {
    // Clear previous QR code
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = '';
    
    // Generate QR code data
    const qrData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        timestamp: new Date().toISOString()
    };
    
    // Convert to JSON string for QR code
    const qrString = JSON.stringify(qrData);
    
    // Generate QR code
    const qrcode = new QRCode(qrContainer, {
        text: qrString,
        width: 300,
        height: 300,
        colorDark: '#007bff',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Store QR code data
    user.qrCode = qrString;
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function generateNewQR() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        displayQRCode(currentUser);
        showAlert('New QR code generated!', 'success');
    }
}

function downloadQRCode() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Get canvas from QR code
    const canvas = document.querySelector('#qrCode canvas');
    if (!canvas) {
        showAlert('QR code not found', 'error');
        return;
    }
    
    // Convert canvas to blob and download
    canvas.toBlob(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trusttag_qr_${currentUser.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showAlert('QR code downloaded!', 'success');
    });
}

function printQRCode() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const canvas = document.querySelector('#qrCode canvas');
    if (!canvas) {
        showAlert('QR code not found', 'error');
        return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '', 'height=600,width=800');
    const qrImage = canvas.toDataURL('image/png');
    
    printWindow.document.write(`
        <html>
        <head>
            <title>TrustTag QR Code - ${currentUser.name}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }
                h1 { color: #007bff; }
                .user-info { margin: 1rem 0; text-align: center; }
                img { margin: 1rem 0; border: 2px solid #007bff; padding: 1rem; }
                .footer { margin-top: 2rem; font-size: 0.9rem; color: #666; }
            </style>
        </head>
        <body>
            <h1>TrustTag Verification QR Code</h1>
            <div class="user-info">
                <p><strong>${currentUser.name}</strong></p>
                <p>ID: ${currentUser.id}</p>
                <p>${formatRole(currentUser.role)}</p>
            </div>
            <img src="${qrImage}" alt="QR Code">
            <div class="footer">
                <p>Scan this QR code to verify identity</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    showAlert('QR code sent to printer', 'success');
}

// =============================================
// Utility Functions
// =============================================

function generateUserId() {
    return 'TT' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function formatRole(role) {
    const roles = {
        'customer': 'Customer',
        'provider': 'Service Provider',
        'company': 'Company'
    };
    return roles[role] || role;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at top of main container
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
        mainContainer.insertBefore(alert, mainContainer.firstChild);
    }
    
    // Remove after 4 seconds
    setTimeout(() => {
        alert.remove();
    }, 4000);
}

// =============================================
// Demo User (Optional - for testing)
// =============================================

function createDemoUsers() {
    const demoUsers = [
        {
            id: 'TTDEMO001',
            name: 'John Delivery',
            email: 'john@trusttag.com',
            phone: '+1-555-0001',
            password: 'demo123',
            role: 'provider',
            createdAt: new Date().toISOString(),
            qrCode: null,
            qrScans: 15,
            verifications: 8
        },
        {
            id: 'TTDEMO002',
            name: 'Sarah Customer',
            email: 'sarah@trusttag.com',
            phone: '+1-555-0002',
            password: 'demo123',
            role: 'customer',
            createdAt: new Date().toISOString(),
            qrCode: null,
            qrScans: 3,
            verifications: 12
        }
    ];
    
    // Only create if no users exist
    if (!localStorage.getItem('trusttagUsers')) {
        localStorage.setItem('trusttagUsers', JSON.stringify(demoUsers));
    }
}

// Uncomment to create demo users
// createDemoUsers();