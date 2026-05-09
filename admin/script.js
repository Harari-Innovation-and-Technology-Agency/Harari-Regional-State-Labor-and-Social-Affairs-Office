import {
  getDashboardStats,
  getMessages,
  getNewsById,
  getPages,
  getServices,
  getGallery,
  getUsers,
  getSettings,
  logout 
} from "./api.js";

const contentArea = document.getElementById("contentArea");
const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");
const loadingOverlay = document.getElementById("loadingOverlay");

// Track current component to prevent re-loading
let currentComponent = null;
let currentSection = null;
let currentUserRole = null;

function requireAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  if (!token) {
    window.location.href = "/admin/admin-login";
    return false;
  }
  
  try {
    const userData = JSON.parse(user || '{}');
    currentUserRole = userData.role;
    console.log('Current user role:', currentUserRole);
    return true;
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return false;
  }
}

requireAuth();

/* ==============================
   ROLE-BASED ACCESS CONTROL
============================== */
function hasAccessToSection(section) {
  // Super Admin has access to everything
  if (currentUserRole === 'super_admin') {
    return true;
  }
  
  // Admin access - everything EXCEPT users
  if (currentUserRole === 'admin') {
    const restrictedSections = ['users'];
    return !restrictedSections.includes(section);
  }
  
  // Editor access
  if (currentUserRole === 'editor') {
    const allowedSections = ['dashboard', 'news', 'services', 'gallery', 'contacts'];
    return allowedSections.includes(section);
  }
  
  // Viewer access
  if (currentUserRole === 'viewer') {
    const allowedSections = ['dashboard', 'news', 'gallery'];
    return allowedSections.includes(section);
  }
  
  return false;
}

function setupRoleBasedUI() {
  // Update navigation visibility based on role
  document.querySelectorAll(".nav-link").forEach(link => {
    const section = link.dataset.section;
    
    if (hasAccessToSection(section)) {
      link.style.display = "flex";
    } else {
      link.style.display = "none";
    }
  });
  
  // Update dashboard stats visibility based on role
  if (currentUserRole === 'viewer') {
    // Viewers might have limited dashboard
  }
  
  // Add role badge to header
  const userMenu = document.querySelector('.user-menu');
  if (userMenu) {
    let roleBadge = userMenu.querySelector('.role-badge');
    if (!roleBadge) {
      roleBadge = document.createElement('span');
      roleBadge.className = 'role-badge';
      userMenu.appendChild(roleBadge);
    }
    
    const roleNames = {
      'super_admin': 'Super Admin',
      'admin': 'Admin'
    };
    
    roleBadge.textContent = roleNames[currentUserRole] || currentUserRole;
    roleBadge.className = `role-badge role-${currentUserRole}`;
  }
}

/* ==============================
   COMPONENT LOADER
============================== */
async function loadComponent(name) {
  // Check if user has access to this section
  if (!hasAccessToSection(name)) {
    console.error(`Access denied: ${name} section is not available for ${currentUserRole}`);
    window.showNotification?.(`Access denied: You don't have permission to access this section`, 'error');
    
    // Redirect to dashboard
    const dashboardLink = document.querySelector('[data-section="dashboard"]');
    if (dashboardLink) {
      dashboardLink.classList.add("active");
      name = "dashboard";
    } else {
      return;
    }
  }
  
  // Don't reload the same component
  if (currentSection === name) {
    console.log(`${name} is already loaded, skipping`);
    return;
  }
  
  // Clean up previous component if needed
  if (currentComponent && currentComponent.cleanup) {
    await currentComponent.cleanup();
  }
  
  try {
    loadingOverlay.style.display = "flex";

    const res = await fetch(`./components/${name}/${name}.html`);
    if (!res.ok) throw new Error("Component not found");

    contentArea.innerHTML = await res.text();

    updateHeader(name);
    await afterComponentLoad(name);

    currentSection = name;

  } catch (err) {
    console.error(err);
    contentArea.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--danger); margin-bottom: 20px;"></i>
        <h3>Error Loading Component</h3>
        <p style="color: var(--gray);">Unable to load component: ${name}</p>
        <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
          <i class="fas fa-sync"></i> Retry
        </button>
      </div>
    `;
  } finally {
    loadingOverlay.style.display = "none";
  }
}

/* ==============================
   HEADER UPDATE
============================== */
function updateHeader(section) {
  const titles = {
    // Dashboard
    dashboard: ["Dashboard", "System overview"],
    
    // Content Management
    news: ["News Management", "Create and manage news & announcements"],
    services: ["Services Management", "Manage programs & services"],
    gallery: ["Gallery Management", "Upload and manage photos & media"],
    pages: ["Page Management", "Edit static website pages"],
    
    // Communications
    contacts: ["Contact Messages", "View and respond to user inquiries"],
    
    // System Administration
    users: ["User Management", "Manage system users and permissions"],
    settings: ["System Settings", "Configure application settings"],
    
    // Planning & Reporting
    "plan-report": ["Planning & Reporting", "Strategic plans, annual plans, and performance reports"]
  };

  // Set title and description
  pageTitle.textContent = titles[section]?.[0] || "Harari Labour and Social Affairs";
  pageDescription.textContent = titles[section]?.[1] || "";
  
  // Add role-based description modifiers
  if (section === 'users' && currentUserRole === 'super_admin') {
    pageDescription.textContent += ' — Super Admin Only';
  }
  
  if (section === 'settings' && currentUserRole === 'super_admin') {
    pageDescription.textContent += ' — Full Access';
  } else if (section === 'settings' && currentUserRole === 'admin') {
    pageDescription.textContent += ' — View Only';
  }
  
  if (section === 'plan-report') {
    const year = new Date().getFullYear();
    pageDescription.textContent += ` — FY ${year-1}/${year}`;
  }
  
  // Log for debugging
  console.log(`Header updated: ${section} → ${pageTitle.textContent}`);
}

/* ==============================
   AFTER LOAD HOOK (BACKEND WIRING)
============================== */
async function afterComponentLoad(section) {
  // Clear current component reference
  currentComponent = null;

  /* DASHBOARD */
  if (section === "dashboard") {
    try {
      const module = await import(`/admin/assets/js/dashboard.js`);
      currentComponent = module;
      await module.initDashboard();
    } catch (error) {
      console.error("Failed to load dashboard module:", error);
      window.showNotification?.('Failed to load dashboard', 'error');
    }
  }

  /* NEWS */
  if (section === "news") {
    try {
      const module = await import(`/admin/assets/js/news.js`);
      currentComponent = module;
      await module.initNews();
    } catch (error) {
      console.error("Failed to load news module:", error);
      window.showNotification?.('Failed to load news', 'error');
    }
  }

  /* PAGES */
  if (section === "pages") {
    try {
      const module = await import(`/admin/assets/js/pages.js`);
      currentComponent = module;
      await module.initPages();
    } catch (error) {
      console.error("Failed to load pages module:", error);
      window.showNotification?.('Failed to load pages', 'error');
    }
  }

  /* SERVICES */
  if (section === "services") {
    try {
      const module = await import(`/admin/assets/js/services.js`);
      currentComponent = module;
      await module.initServices();
    } catch (error) {
      console.error("Failed to load services module:", error);
      window.showNotification?.('Failed to load services', 'error');
    }
  }

  /* GALLERY */
  if (section === "gallery") {
    try {
      const module = await import(`/admin/assets/js/gallery.js`);
      currentComponent = module;
      await module.initGallery();
    } catch (error) {
      console.error("Failed to load gallery module:", error);
      // Fallback: try to load gallery directly
      try {
        const response = await getGallery();
        console.log("Gallery items (fallback):", response.images || response);
        
        const galleryGrid = document.getElementById("galleryGrid");
        if (galleryGrid && response.images) {
          galleryGrid.innerHTML = response.images.map(img => `
            <div class="gallery-item">
              <img src="${img.url}" alt="${img.caption}" style="width:100%;height:200px;object-fit:cover;border-radius:8px;">
            </div>
          `).join('');
        }
      } catch (e) {
        console.error("Even fallback failed:", e);
        window.showNotification?.('Failed to load gallery', 'error');
      }
    }
  }

  /* CONTACTS */
/* CONTACTS */
if (section === "contacts") {
  try {
    const module = await import(`/admin/assets/js/contact.js`);
    currentComponent = module;
    await module.initContacts();
  } catch (error) {
    console.error("Failed to load contacts module:", error);
    
    // Fallback: basic contacts display
    try {
      const messages = await getMessages();
      const badge = document.getElementById("contactBadge");
      if (badge) {
        badge.textContent = messages.contacts?.length || 0;
      }
    } catch (e) {
      console.error("Even fallback failed:", e);
    }
  }
}

  /* USERS - SUPER ADMIN ONLY */
  if (section === "users") {
    // Double-check access at runtime
    if (currentUserRole !== 'super_admin') {
      console.error('Access denied: Only super admin can access users section');
      window.showNotification?.('Access denied: Only super admin can manage users', 'error');
      
      // Redirect to dashboard
      const dashboardLink = document.querySelector('[data-section="dashboard"]');
      if (dashboardLink) {
        dashboardLink.classList.add("active");
        loadComponent("dashboard");
      }
      return;
    }
    
    try {
      const module = await import(`/admin/assets/js/users.js`);
      currentComponent = module;
      await module.initUsers();
    } catch (error) {
      console.error("Failed to load users module:", error);
      window.showNotification?.('Failed to load users', 'error');
    }
  }
 
  /* PLAN & REPORT */
if (section === "plan-report") {
  try {
    const module = await import(`/admin/assets/js/plan-report.js`);
    currentComponent = module;
    await module.initPlanReport();
  } catch (error) {
    console.error("Failed to load plan & report module:", error);
  }
}

  /* SETTINGS */
  if (section === "settings") {
    try {
      // Only super_admin and admin can access settings
      if (!['super_admin', 'admin'].includes(currentUserRole)) {
        window.showNotification?.('Access denied: You don\'t have permission to access settings', 'error');
        return;
      }
      
      await getSettings();
      const module = await import(`/admin/assets/js/settings.js`);
      currentComponent = module;
      await module.initSettings();
    } catch (error) {
      console.error("Failed to load settings:", error);
      window.showNotification?.('Failed to load settings', 'error');
    }
  }
}

/* ==============================
   NAVIGATION
============================== */
function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      const section = link.dataset.section;
      if (!section) return;
      
      // Check access before activating
      if (!hasAccessToSection(section)) {
        window.showNotification?.(`Access denied: ${section} section is not available`, 'error');
        return;
      }
      
      document.querySelectorAll(".nav-link")
        .forEach(l => l.classList.remove("active"));

      link.classList.add("active");
      loadComponent(section);
    });
  });
}

/* ==============================
   MOBILE MENU
============================== */
document.getElementById("mobileMenuBtn").onclick = () => {
  document.getElementById("sidebar").classList.toggle("open");
};

/* ==============================
   USER MENU & PROFILE
============================== */
function setupUserMenu() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to logout?")) {
        logout();
      }
    });
  }
  
  // Display user info in header
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userNameElement = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");
    
    if (userNameElement) {
      userNameElement.textContent = user.username || 'Admin User';
    }
    
    if (userAvatar) {
      const initials = (user.username || 'AU').charAt(0).toUpperCase();
      userAvatar.textContent = initials;
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

/* ==============================
   INITIALIZATION
============================== */
document.addEventListener("DOMContentLoaded", async () => {
  // Verify authentication and get user role
  if (!requireAuth()) return;
  
  // Setup role-based UI
  setupRoleBasedUI();
  
  // Setup navigation
  setupNavigation();
  
  // Setup user menu
  setupUserMenu();
  
  // Set dashboard as active initially
  const dashboardLink = document.querySelector('[data-section="dashboard"]');
  if (dashboardLink && hasAccessToSection('dashboard')) {
    dashboardLink.classList.add("active");
    await loadComponent("dashboard");
  }
  
  // Hide loading overlay after initial load
  setTimeout(() => {
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
  }, 600);
});

/* ==============================
   GLOBAL ERROR HANDLER
============================== */
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled rejection:', event.reason);
  window.showNotification?.('An unexpected error occurred', 'error');
});

// Make loadComponent available globally for inline handlers
window.loadComponent = loadComponent;