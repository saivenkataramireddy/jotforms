// Admin credentials (in production, this should be server-side)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Data storage for forms (in production, use a database)
let formsData = {
    maxmus: [],
    nucles: [],
    gladius: [],
    stimulas: [],
    glamus: [],
    nutrius: []
};

let currentDivision = null;

// DOM Elements
const loginSection = document.getElementById('loginSection');
const adminSection = document.getElementById('adminSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const divisionManagement = document.getElementById('divisionManagement');
const selectedDivisionTitle = document.getElementById('selectedDivisionTitle');
const formNameInput = document.getElementById('formName');
const formLinkInput = document.getElementById('formLink');
const uploadBtn = document.getElementById('uploadBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formsList = document.getElementById('formsList');
const divisionButtons = document.querySelectorAll('.division-btn');

// Initialize
function init() {
    // Check if already logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        showAdminDashboard();
    }

    // Load data from localStorage if available
    const savedData = localStorage.getItem('formsData');
    if (savedData) {
        formsData = JSON.parse(savedData);
    }
}

// Login Handler
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('isLoggedIn', 'true');
        loginError.textContent = '';
        showAdminDashboard();
    } else {
        loginError.textContent = 'Invalid username or password';
    }
});

// Logout Handler
logoutBtn.addEventListener('click', function () {
    sessionStorage.removeItem('isLoggedIn');
    currentDivision = null;
    hideAdminDashboard();
});

// Show Admin Dashboard
function showAdminDashboard() {
    loginSection.style.display = 'none';
    adminSection.style.display = 'block';
    document.body.style.background = '#f5f5f5';
}

// Hide Admin Dashboard
function hideAdminDashboard() {
    adminSection.style.display = 'none';
    loginSection.style.display = 'flex';
    document.body.style.background = '';
    loginForm.reset();

    // Reset division management
    divisionManagement.style.display = 'none';
    divisionButtons.forEach(btn => btn.classList.remove('active'));
    currentDivision = null;
}

// Division Selection Handler
divisionButtons.forEach(button => {
    button.addEventListener('click', function () {
        // Remove active class from all buttons
        divisionButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        this.classList.add('active');

        // Get selected division
        currentDivision = this.getAttribute('data-division');

        // Show division management
        showDivisionManagement(currentDivision);
    });
});

// Show Division Management
function showDivisionManagement(division) {
    divisionManagement.style.display = 'block';
    selectedDivisionTitle.textContent = division.charAt(0).toUpperCase() + division.slice(1) + ' Division Forms';

    // Clear inputs and reset edit mode
    formNameInput.value = '';
    formLinkInput.value = '';
    uploadBtn.textContent = 'Upload Form';
    uploadBtn.classList.add('btn-upload');
    uploadBtn.classList.remove('btn-update');
    uploadBtn.removeAttribute('data-editing-id');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }

    // Render forms list
    renderFormsList();

    // Scroll to management section
    divisionManagement.scrollIntoView({ behavior: 'smooth' });
}

// Upload/Update Form Handler
uploadBtn.addEventListener('click', function () {
    if (!currentDivision) {
        alert('Please select a division first');
        return;
    }

    const formName = formNameInput.value.trim();
    const formLink = formLinkInput.value.trim();
    const editingId = this.getAttribute('data-editing-id');

    if (!formName || !formLink) {
        alert('Please enter both form name and link');
        return;
    }

    // Validate URL
    if (!isValidURL(formLink)) {
        alert('Please enter a valid URL');
        return;
    }

    if (editingId) {
        // Update existing form
        const formIndex = formsData[currentDivision].findIndex(f => f.id == editingId);
        if (formIndex !== -1) {
            formsData[currentDivision][formIndex].name = formName;
            formsData[currentDivision][formIndex].link = formLink;
            formsData[currentDivision][formIndex].updatedAt = new Date().toLocaleString();
            alert('Form updated successfully!');
        }
        // Reset button state and hide cancel button
        uploadBtn.textContent = 'Upload Form';
        uploadBtn.classList.add('btn-upload');
        uploadBtn.classList.remove('btn-update');
        uploadBtn.removeAttribute('data-editing-id');
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
    } else {
        // Add new form
        const newForm = {
            id: Date.now(),
            name: formName,
            link: formLink,
            createdAt: new Date().toLocaleString()
        };

        formsData[currentDivision].push(newForm);
        alert('Form uploaded successfully!');
    }

    // Save to localStorage
    localStorage.setItem('formsData', JSON.stringify(formsData));

    // Clear inputs
    formNameInput.value = '';
    formLinkInput.value = '';

    // Render updated list
    renderFormsList();
});

// Validate URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Render Forms List
function renderFormsList() {
    if (!currentDivision) return;

    const forms = formsData[currentDivision];

    if (forms.length === 0) {
        formsList.innerHTML = '<div class="empty-state">No forms available. Add a new form above.</div>';
        return;
    }

    formsList.innerHTML = forms.map(form => `
        <div class="form-item" data-id="${form.id}">
            <div class="form-info">
                <h4>${escapeHtml(form.name)}</h4>
                <a href="${escapeHtml(form.link)}" target="_blank">${escapeHtml(form.link)}</a>
                <small style="display: block; color: #999; margin-top: 5px;">${form.updatedAt ? 'Updated: ' + form.updatedAt : 'Added: ' + form.createdAt}</small>
            </div>
            <div class="form-actions">
                <a href="${escapeHtml(form.link)}" target="_blank" class="btn-view">View</a>
                <button class="btn-edit" onclick="editForm(${form.id})">Edit</button>
                <button class="btn-delete" onclick="deleteForm(${form.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Delete Form Handler
function deleteForm(formId) {
    if (!currentDivision) return;

    if (!confirm('Are you sure you want to delete this form?')) {
        return;
    }

    // Remove form from data
    formsData[currentDivision] = formsData[currentDivision].filter(form => form.id !== formId);

    // Save to localStorage
    localStorage.setItem('formsData', JSON.stringify(formsData));

    // Render updated list
    renderFormsList();

    alert('Form deleted successfully!');
}

// Edit Form Handler
function editForm(formId) {
    if (!currentDivision) return;

    const form = formsData[currentDivision].find(f => f.id === formId);
    if (!form) return;

    // Populate inputs with form data
    formNameInput.value = form.name;
    formLinkInput.value = form.link;

    // Change upload button to update button
    uploadBtn.textContent = 'Update Form';
    uploadBtn.classList.add('btn-update');
    uploadBtn.classList.remove('btn-upload');

    // Store the form being edited
    uploadBtn.setAttribute('data-editing-id', formId);

    // Show cancel button
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
    }

    // Scroll to form inputs
    document.querySelector('.add-form-section').scrollIntoView({ behavior: 'smooth' });
}

// Cancel Edit Handler
function cancelEdit() {
    formNameInput.value = '';
    formLinkInput.value = '';
    uploadBtn.textContent = 'Upload Form';
    uploadBtn.classList.add('btn-upload');
    uploadBtn.classList.remove('btn-update');
    uploadBtn.removeAttribute('data-editing-id');

    // Hide cancel button
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
init();
