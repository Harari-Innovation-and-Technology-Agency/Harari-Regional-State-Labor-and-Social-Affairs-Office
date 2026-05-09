import { getDashboardStats, getRecentActivity } from "../../api.js";

let isInitialized = false;
let refreshInterval = null;

export async function initDashboard() {
  if (isInitialized) {
    console.log("Dashboard already initialized, skipping");
    return;
  }
  
  console.log("Initializing dashboard...");
  
  try {
    await loadStats();
    await loadActivity();
    setupQuickActions(); // ✅ Add this line
    
    // Optional: Auto-refresh every 30 seconds
    // refreshInterval = setInterval(refreshDashboard, 30000);
    
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
    window.showNotification?.('Failed to load dashboard data', 'error');
  }
}

export async function cleanup() {
  console.log("Cleaning up dashboard...");
  
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  
  // Remove quick action listeners
  const quickActionBtns = document.querySelectorAll('.quick-action-btn');
  quickActionBtns.forEach(btn => {
    btn.removeEventListener('click', handleQuickAction);
  });
  
  isInitialized = false;
}

// ==================== QUICK ACTIONS ====================
function setupQuickActions() {
  const quickActionBtns = document.querySelectorAll('.quick-action-btn');
  
  // Remove existing listeners first (to prevent duplicates)
  quickActionBtns.forEach(btn => {
    btn.removeEventListener('click', handleQuickAction);
    btn.addEventListener('click', handleQuickAction);
  });
  
  console.log(`Setup ${quickActionBtns.length} quick action buttons`);
}

function handleQuickAction(e) {
  e.preventDefault();
  
  const btn = e.currentTarget;
  const section = btn.dataset.section;
  
  if (!section) {
    console.warn('No section specified for quick action');
    return;
  }
  
  console.log(`Quick action: Navigating to ${section}`);
  
  // Find and click the corresponding nav link
  const navLink = document.querySelector(`.nav-link[data-section="${section}"]`);
  
  if (navLink) {
    // Trigger click on nav link
    navLink.click();
    
    // Show success notification
    window.showNotification?.(`Navigating to ${section}...`, 'info');
  } else {
    console.error(`Navigation link for ${section} not found`);
    window.showNotification?.(`Cannot navigate to ${section}`, 'error');
  }
}

// ==================== LOAD STATS ====================
async function loadStats() {
  try {
    const stats = await getDashboardStats();
    
    // Update stats cards with animation
    animateNumber('newsCount', stats.news || 0);
    animateNumber('galleryCount', stats.gallery || 0);
    animateNumber('servicesCount', stats.services || 0);
    animateNumber('contactsCount', stats.contacts || 0);
    
  } catch (error) {
    console.error('Failed to load stats:', error);
    throw error;
  }
}

// ==================== LOAD ACTIVITY ====================
async function loadActivity() {
  try {
    const activity = await getRecentActivity();
    const tbody = document.getElementById("activityTableBody");

    if (!tbody) return;

    if (!activity || activity.length === 0) {
      showEmptyState(tbody);
      return;
    }

    tbody.innerHTML = "";

    activity.slice(0, 10).forEach(item => { // Show only 10 most recent
      const row = createActivityRow(item);
      tbody.appendChild(row);
    });
    
  } catch (error) {
    console.error('Failed to load activity:', error);
    throw error;
  }
}

// ==================== HELPER FUNCTIONS ====================
function createActivityRow(item) {
  const row = document.createElement("tr");
  
  // Format date
  let dateDisplay = 'N/A';
  try {
    dateDisplay = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    dateDisplay = item.date || 'N/A';
  }
  
  // Get status badge class
  let statusClass = 'status-published';
  let statusIcon = 'fa-check-circle';
  
  if (item.status === 'draft' || item.status === 'Draft') {
    statusClass = 'status-draft';
    statusIcon = 'fa-pen';
  } else if (item.status === 'archived' || item.status === 'Archived') {
    statusClass = 'status-archived';
    statusIcon = 'fa-archive';
  }
  
  row.innerHTML = `
    <td>
      <span style="display: flex; align-items: center; gap: 8px;">
        <i class="fas ${getActivityIcon(item.type)}" style="color: var(--primary); width: 20px;"></i>
        <span>${item.type || 'Unknown'}</span>
      </span>
    </td>
    <td>${item.description || 'No description'}</td>
    <td>${dateDisplay}</td>
    <td>
      <span class="status-badge ${statusClass}">
        <i class="fas ${statusIcon}"></i>
        ${item.status || 'Published'}
      </span>
    </td>
  `;
  
  return row;
}

function getActivityIcon(type) {
  const icons = {
    'News': 'fa-newspaper',
    'Service': 'fa-briefcase',
    'Gallery': 'fa-image',
    'Contact': 'fa-envelope',
    'User': 'fa-user',
    'Page': 'fa-file-alt',
    'Default': 'fa-clock'
  };
  
  return icons[type] || icons['Default'];
}

function showEmptyState(tbody) {
  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align: center; padding: 40px;">
        <div class="empty-activity">
          <i class="fas fa-history" style="font-size: 48px; color: var(--gray); opacity: 0.5;"></i>
          <p style="margin-top: 15px; color: var(--gray);">No recent activity</p>
        </div>
      </td>
    </tr>
  `;
}

// Animate number counting
function animateNumber(elementId, finalValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const startValue = parseInt(element.textContent) || 0;
  if (startValue === finalValue) return;
  
  const duration = 1000; // 1 second
  const steps = 20;
  const increment = (finalValue - startValue) / steps;
  let currentStep = 0;
  
  const timer = setInterval(() => {
    currentStep++;
    const currentValue = Math.round(startValue + (increment * currentStep));
    element.textContent = currentValue;
    
    if (currentStep >= steps) {
      element.textContent = finalValue;
      clearInterval(timer);
    }
  }, duration / steps);
}

// Manual refresh function
export async function refreshDashboard() {
  console.log("Refreshing dashboard data...");
  try {
    await loadStats();
    await loadActivity();
    window.showNotification?.('Dashboard refreshed', 'success');
  } catch (error) {
    window.showNotification?.('Failed to refresh dashboard', 'error');
  }
}