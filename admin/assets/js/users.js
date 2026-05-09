import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from "../../api.js";

let isInitialized = false;
let usersData = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalUsers = 0;
let currentFilter = {
  role: 'all',
  status: 'all',
  search: ''
};
let editMode = false;
let currentUserId = null;

export async function initUsers() {
  if (isInitialized) {
    console.log("Users already initialized");
    return;
  }
  
  console.log("Initializing users management...");
  
  try {
    // Make functions globally available
    window.editUser = editUser;
    window.deleteUser = deleteUserHandler;
    window.toggleUserStatus = toggleUserStatus;
    window.resetUserForm = resetForm;
    
    await loadUsers();
    setupEventListeners();
    updateStats();
    
   
    
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize users:", error);
    window.showNotification('Failed to load users', 'error');  }
}

export function cleanup() {
  console.log("Cleaning up users...");
  
  window.editUser = null;
  window.deleteUser = null;
  window.toggleUserStatus = null;
  window.resetUserForm = null;
  
  isInitialized = false;
}

// ==================== LOAD USERS ====================
async function loadUsers() {
  try {
    showLoading(true);
    
    const response = await getUsers();
    usersData = response.users || response.data || (Array.isArray(response) ? response : []);
    
    console.log(`Loaded ${usersData.length} users`);
    
    const filteredUsers = filterUsers(usersData);
    totalUsers = filteredUsers.length;
    
    const paginatedUsers = paginateUsers(filteredUsers);
    
    renderUsersTable(paginatedUsers);
    renderMobileCards(paginatedUsers);
    updatePagination();
    updateStats();
    
  } catch (error) {
    console.error("Failed to load users:", error);
    showNotification('Failed to load users', 'error');
  } finally {
    showLoading(false);
  }
}

// ==================== FILTERING ====================
function filterUsers(users) {
  return users.filter(user => {
    // Role filter
    if (currentFilter.role !== 'all' && user.role !== currentFilter.role) {
      return false;
    }
    
    // Status filter
    if (currentFilter.status !== 'all') {
      if (currentFilter.status === 'active' && !user.isActive) return false;
      if (currentFilter.status === 'inactive' && user.isActive !== false) return false;
    }
    
    // Search filter
    if (currentFilter.search) {
      const searchTerm = currentFilter.search.toLowerCase();
      return (
        user.username?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.role?.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });
}

function paginateUsers(users) {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return users.slice(start, end);
}

// ==================== RENDER TABLE ====================
function renderUsersTable(users) {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;
  
  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <i class="fas fa-users-slash" style="font-size: 48px; color: var(--gray); opacity: 0.5;"></i>
          <p style="margin-top: 15px; color: var(--gray);">No users found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr data-id="${user._id}">
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="user-avatar">
            ${getInitials(user.username || user.email)}
          </div>
          <div>
            <strong>${user.username || 'No username'}</strong>
            ${user._id === getCurrentUserId() ? '<span style="font-size: 11px; color: var(--primary); margin-left: 5px;">(You)</span>' : ''}
          </div>
        </div>
      </td>
      <td>${user.email || 'No email'}</td>
      <td>
        <span class="role-badge role-${user.role || 'viewer'}">
          <i class="fas ${getRoleIcon(user.role)}"></i>
          ${capitalize(user.role || 'viewer')}
        </span>
      </td>
      <td>
        <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}" 
              onclick="toggleUserStatus('${user._id}')"
              style="cursor: pointer;">
          <i class="fas ${user.isActive ? 'fa-check-circle' : 'fa-circle'}"></i>
          ${user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
      </td>
      <td>
        <div style="display: flex; gap: 5px;">
          <button class="btn btn-sm btn-primary" onclick="editUser('${user._id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')" 
                  title="Delete" ${user._id === getCurrentUserId() ? 'disabled' : ''}>
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ==================== RENDER MOBILE CARDS ====================
function renderMobileCards(users) {
  const container = document.getElementById('mobileUserCards');
  if (!container) return;
  
  if (!users || users.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px;">
        <i class="fas fa-users-slash" style="font-size: 40px; color: var(--gray); opacity: 0.5;"></i>
        <p style="margin-top: 15px; color: var(--gray);">No users found</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = users.map(user => `
    <div class="mobile-user-card">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div class="user-avatar">
          ${getInitials(user.username || user.email)}
        </div>
        <div style="flex: 1;">
          <strong style="font-size: 16px;">${user.username || 'No username'}</strong>
          ${user._id === getCurrentUserId() ? '<span style="font-size: 11px; color: var(--primary); margin-left: 5px;">(You)</span>' : ''}
          <div style="font-size: 13px; color: var(--gray);">${user.email}</div>
        </div>
      </div>
      
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
        <span class="role-badge role-${user.role || 'viewer'}">
          <i class="fas ${getRoleIcon(user.role)}"></i>
          ${capitalize(user.role || 'viewer')}
        </span>
        <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}" 
              onclick="toggleUserStatus('${user._id}')" style="cursor: pointer;">
          <i class="fas ${user.isActive ? 'fa-check-circle' : 'fa-circle'}"></i>
          ${user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <div style="font-size: 12px; color: var(--gray); margin-bottom: 15px;">
        <i class="fas fa-clock"></i> Last login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
      </div>
      
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-sm btn-primary" onclick="editUser('${user._id}')" style="flex: 1;">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${user._id}')" 
                style="flex: 1;" ${user._id === getCurrentUserId() ? 'disabled' : ''}>
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `).join('');
}

// ==================== FORM HANDLING ====================
async function handleSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('userSubmitBtn');
  const formTitle = document.getElementById('formTitle');
  const userId = document.getElementById('userId')?.value;
  
  const username = document.getElementById('userUsername').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword')?.value;
  const role = document.getElementById('userRole').value;
  
  if (!username || !email) {
    showNotification('Username and email are required', 'warning');
    return;
  }
  
  if (!editMode && (!password || password.length < 6)) {
    showNotification('Password must be at least 6 characters', 'warning');
    return;
  }
  
  const userData = {
    username,
    email,
    role,
    isActive: true
  };
  
  if (password && password.length > 0) {
    userData.password = password;
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    if (editMode && userId) {
      await updateUser(userId, userData);
      showNotification('User updated successfully', 'success');
    } else {
      await createUser(userData);
      showNotification('User created successfully', 'success');
    }
    
    // ✅ FIX: Complete form reset
    resetForm();
    
    // ✅ FIX: Reload users list
    await loadUsers();
    
  } catch (error) {
    console.error('Failed to save user:', error);
    showNotification(error.message || 'Failed to save user', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = editMode ? 
      '<i class="fas fa-save"></i> Update User' : 
      '<i class="fas fa-user-plus"></i> Create User';
  }
}

// ==================== EDIT USER ====================
window.editUser = async function(id) {
  try {
    showLoading(true);
    
    const user = usersData.find(u => u._id === id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Remove any existing dynamically added fields
    const existingUserId = document.getElementById('userId');
    if (existingUserId) existingUserId.remove();
    
    const existingStatusField = document.getElementById('userIsActive');
    if (existingStatusField) {
      const parent = existingStatusField.closest('.form-group');
      if (parent) parent.remove();
    }
    
    // Add hidden ID field
    const userIdInput = document.createElement('input');
    userIdInput.type = 'hidden';
    userIdInput.id = 'userId';
    userIdInput.value = user._id;
    document.getElementById('userForm').appendChild(userIdInput);
    
    // Add status field for edit mode
    const form = document.getElementById('userForm');
    const statusGroup = document.createElement('div');
    statusGroup.className = 'form-group';
    statusGroup.id = 'statusGroup';
    statusGroup.style.marginTop = '15px';
    statusGroup.innerHTML = `
      <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
        <input type="checkbox" id="userIsActive" ${user.isActive !== false ? 'checked' : ''}>
        <span><strong>Active Status</strong> - User can login</span>
      </label>
    `;
    form.appendChild(statusGroup);
    
    // Populate form fields
    document.getElementById('userUsername').value = user.username || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = user.role || 'editor';
    
    // Update password field label and remove required attribute
    const passwordLabel = document.querySelector('label[for="userPassword"]');
    if (passwordLabel) {
      passwordLabel.innerHTML = '<i class="fas fa-lock"></i> New Password (leave blank to keep current)';
    }
    document.getElementById('userPassword').required = false;
    
    // Update form title and button
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit User';
    document.getElementById('userSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update User';
    
    editMode = true;
    currentUserId = id;
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    console.error('Failed to load user for editing:', error);
    showNotification('Failed to load user details', 'error');
  } finally {
    showLoading(false);
  }
};

// ==================== DELETE USER ====================
window.deleteUserHandler = async function(id) {
  if (id === getCurrentUserId()) {
    showNotification('You cannot delete your own account', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }
  
  try {
    showLoading(true);
    await deleteUser(id);
    showNotification('User deleted successfully', 'success');
    await loadUsers();
    
    if (editMode && currentUserId === id) {
      resetForm();
    }
  } catch (error) {
    console.error('Failed to delete user:', error);
    showNotification(error.message || 'Failed to delete user', 'error');
  } finally {
    showLoading(false);
  }
};

// ==================== TOGGLE STATUS ====================
window.toggleUserStatus = async function(id) {
  if (id === getCurrentUserId()) {
    showNotification('You cannot deactivate your own account', 'warning');
    return;
  }
  
  try {
    const user = usersData.find(u => u._id === id);
    if (!user) return;
    
    const newStatus = !user.isActive;
    
    await updateUser(id, { isActive: newStatus });
    
    showNotification(`User ${newStatus ? 'activated' : 'deactivated'}`, 'success');
    
    user.isActive = newStatus;
    
    const filteredUsers = filterUsers(usersData);
    const paginatedUsers = paginateUsers(filteredUsers);
    renderUsersTable(paginatedUsers);
    renderMobileCards(paginatedUsers);
    updateStats();
    
  } catch (error) {
    console.error('Failed to toggle user status:', error);
    showNotification('Failed to update user status', 'error');
  }
};

// ==================== STATS UPDATE ====================
function updateStats() {
  const total = usersData.length;
  const active = usersData.filter(u => u.isActive !== false).length;
  const admins = usersData.filter(u => u.role === 'admin').length;
  const editors = usersData.filter(u => u.role === 'editor').length;
  
  const totalEl = document.getElementById('totalUsersCount');
  const activeEl = document.getElementById('activeUsersCount');
  const adminEl = document.getElementById('adminCount');
  const editorEl = document.getElementById('editorCount');
  
  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
  if (adminEl) adminEl.textContent = admins;
  if (editorEl) editorEl.textContent = editors;
}

// ==================== PAGINATION ====================
function updatePagination() {
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(start + itemsPerPage - 1, totalUsers);
  
  const paginationInfo = document.getElementById('paginationInfo');
  if (paginationInfo) {
    paginationInfo.textContent = 
      `Showing ${totalUsers ? start : 0}-${totalUsers ? end : 0} of ${totalUsers} users`;
  }
  
  const currentPageEl = document.getElementById('currentPage');
  if (currentPageEl) {
    currentPageEl.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  }
  
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// ==================== FORM UTILITIES ====================
function resetForm() {
  console.log('Resetting form...');
  
  // Reset form fields
  const form = document.getElementById('userForm');
  if (form) {
    form.reset();
  }
  
  // Remove hidden ID field
  const userIdInput = document.getElementById('userId');
  if (userIdInput) {
    userIdInput.remove();
  }
  
  // Remove status field if exists
  const statusGroup = document.getElementById('statusGroup');
  if (statusGroup) {
    statusGroup.remove();
  }
  
  // Reset password field
  const passwordField = document.getElementById('userPassword');
  if (passwordField) {
    passwordField.value = '';
    passwordField.required = true;
    
    // Reset password label
    const passwordLabel = document.querySelector('label[for="userPassword"]');
    if (passwordLabel) {
      passwordLabel.innerHTML = '<i class="fas fa-lock"></i> Password *';
    }
  }
  
  // Clear password strength indicator
  const strengthIndicator = document.getElementById('passwordStrength');
  if (strengthIndicator) {
    strengthIndicator.textContent = '';
    strengthIndicator.className = 'password-strength';
  }
  
  // Reset form title
  const formTitle = document.getElementById('formTitle');
  if (formTitle) {
    formTitle.innerHTML = '<i class="fas fa-user-plus"></i> Add New User';
  }
  
  // Reset submit button
  const submitBtn = document.getElementById('userSubmitBtn');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create User';
  }
  
  // Reset state
  editMode = false;
  currentUserId = null;
  
  console.log('Form reset complete');
}

// ==================== FILTER HANDLERS ====================
function handleFilterChange() {
  currentPage = 1;
  loadUsers();
}

function handleSearch(e) {
  currentFilter.search = e.target.value;
  currentPage = 1;
  loadUsers();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Form submission
  const form = document.getElementById('userForm');
  if (form) {
    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', handleSubmit);
  }
  
  // Reset button
  const resetBtn = document.getElementById('resetUserForm');
  if (resetBtn) {
    resetBtn.removeEventListener('click', resetForm);
    resetBtn.addEventListener('click', resetForm);
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshUsers');
  if (refreshBtn) {
    refreshBtn.removeEventListener('click', loadUsers);
    refreshBtn.addEventListener('click', loadUsers);
  }
  
  // Role filter
  const roleFilter = document.getElementById('roleFilter');
  if (roleFilter) {
    roleFilter.removeEventListener('change', (e) => {
      currentFilter.role = e.target.value;
      handleFilterChange();
    });
    roleFilter.addEventListener('change', (e) => {
      currentFilter.role = e.target.value;
      handleFilterChange();
    });
  }
  
  // Status filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.removeEventListener('change', (e) => {
      currentFilter.status = e.target.value;
      handleFilterChange();
    });
    statusFilter.addEventListener('change', (e) => {
      currentFilter.status = e.target.value;
      handleFilterChange();
    });
  }
  
  // Search
  const searchInput = document.getElementById('userSearch');
  if (searchInput) {
    searchInput.removeEventListener('input', handleSearch);
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }
  
  // Pagination
  const prevBtn = document.getElementById('prevPage');
  if (prevBtn) {
    prevBtn.removeEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadUsers();
      }
    });
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadUsers();
      }
    });
  }
  
  const nextBtn = document.getElementById('nextPage');
  if (nextBtn) {
    nextBtn.removeEventListener('click', () => {
      const totalPages = Math.ceil(totalUsers / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        loadUsers();
      }
    });
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(totalUsers / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        loadUsers();
      }
    });
  }
  
  // Password strength indicator
  const passwordInput = document.getElementById('userPassword');
  if (passwordInput) {
    passwordInput.removeEventListener('input', checkPasswordStrength);
    passwordInput.addEventListener('input', checkPasswordStrength);
  }
  
  // Toggle password visibility
  const togglePassword = document.getElementById('togglePassword');
  if (togglePassword) {
    togglePassword.removeEventListener('click', togglePasswordVisibility);
    togglePassword.addEventListener('click', togglePasswordVisibility);
  }
  
  // Email validation
  const emailInput = document.getElementById('userEmail');
  if (emailInput) {
    emailInput.removeEventListener('blur', validateEmail);
    emailInput.addEventListener('blur', validateEmail);
  }
  
  // Username counter
  const usernameInput = document.getElementById('userUsername');
  if (usernameInput) {
    usernameInput.removeEventListener('input', updateUsernameCounter);
    usernameInput.addEventListener('input', updateUsernameCounter);
  }
}

// ==================== UI UTILITIES ====================
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('userPassword');
  const icon = document.getElementById('togglePassword');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

function updateUsernameCounter(e) {
  const counter = document.getElementById('usernameCounter');
  if (counter) {
    const length = e.target.value.length;
    counter.textContent = `${length}/30`;
    counter.style.color = length > 25 ? '#f59e0b' : length > 28 ? '#dc2626' : 'var(--gray)';
  }
}

function validateEmail(e) {
  const email = e.target.value;
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  if (email && !isValid) {
    e.target.style.borderColor = '#dc2626';
    showNotification('Please enter a valid email address', 'warning');
  } else {
    e.target.style.borderColor = '';
  }
}

function checkPasswordStrength(e) {
  const password = e.target.value;
  const indicator = document.getElementById('passwordStrength');
  if (!indicator) return;
  
  if (!password) {
    indicator.textContent = '';
    indicator.className = 'password-strength';
    return;
  }
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]/)) strength++;
  if (password.match(/[A-Z]/)) strength++;
  if (password.match(/[0-9]/)) strength++;
  if (password.match(/[^a-zA-Z0-9]/)) strength++;
  
  let strengthText = '';
  let strengthClass = '';
  
  if (strength < 2) {
    strengthText = 'Weak';
    strengthClass = 'strength-weak';
  } else if (strength < 4) {
    strengthText = 'Medium';
    strengthClass = 'strength-medium';
  } else {
    strengthText = 'Strong';
    strengthClass = 'strength-strong';
  }
  
  indicator.textContent = `Password strength: ${strengthText}`;
  indicator.className = `password-strength ${strengthClass}`;
}

// ==================== UTILITIES ====================
function getInitials(str) {
  if (!str) return 'U';
  return str.charAt(0).toUpperCase();
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRoleIcon(role) {
  const icons = {
    'admin': 'fa-shield-alt',
    'editor': 'fa-edit',
    'viewer': 'fa-eye'
  };
  return icons[role] || 'fa-user';
}

function getCurrentUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user._id || user.id || null;
  } catch {
    return null;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

