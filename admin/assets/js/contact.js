import { 
  getMessages, 
  getMessageById, 
  updateMessageStatus, 
  deleteMessage 
} from "../../api.js";

let isInitialized = false;
let currentFilter = '';
let currentPage = 1;
let itemsPerPage = 10;
let totalContacts = 0;
let contactsData = [];

export async function initContacts() {
  if (isInitialized) {
    console.log("Contacts already initialized");
    return;
  }
  
  console.log("Initializing contacts management...");
  
  try {
    // Make functions globally available for onclick handlers
    window.loadContacts = loadContacts;
    window.viewContact = viewContact;
    window.replyToContact = replyToContact;
    window.deleteContact = deleteContactHandler;
    window.markAsRead = markAsRead;
    window.filterContacts = filterContacts;
    
    await loadContacts();
    setupEventListeners();
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize contacts:", error);
    window.showNotification?.('Failed to load contacts', 'error');
  }
}

export function cleanup() {
  console.log("Cleaning up contacts...");
  
  window.loadContacts = null;
  window.viewContact = null;
  window.replyToContact = null;
  window.deleteContact = null;
  window.markAsRead = null;
  window.filterContacts = null;
  
  isInitialized = false;
}

// ==================== LOAD CONTACTS ====================
async function loadContacts() {
  try {
    showLoading(true);
    
    const filter = document.getElementById('contactFilter')?.value || '';
    currentFilter = filter;
    
    const response = await getMessages(filter, currentPage, itemsPerPage);
    
    contactsData = response.contacts || response.data || (Array.isArray(response) ? response : []);
    totalContacts = response.pagination?.total || contactsData.length;
    
    console.log(`Loaded ${contactsData.length} contacts`);
    
    renderContactsTable(contactsData);
    updatePagination(response.pagination);
    updateStats();
    
  } catch (error) {
    console.error("Failed to load contacts:", error);
    window.showNotification?.('Failed to load messages', 'error');
    
    // Show empty state
    const tbody = document.getElementById('contactTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            <i class="fas fa-envelope-open" style="font-size: 48px; color: var(--gray); opacity: 0.5;"></i>
            <p style="margin-top: 15px; color: var(--gray);">No messages found</p>
          </td>
        </tr>
      `;
    }
  } finally {
    showLoading(false);
  }
}

// ==================== RENDER TABLE ====================
function renderContactsTable(contacts) {
  const tbody = document.getElementById('contactTableBody');
  if (!tbody) return;
  
  if (!contacts || contacts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px;">
          <i class="fas fa-inbox" style="font-size: 48px; color: var(--gray); opacity: 0.5;"></i>
          <p style="margin-top: 15px; color: var(--gray);">No messages found</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = contacts.map(contact => {
    const date = contact.createdAt ? new Date(contact.createdAt).toLocaleString() : 'N/A';
    const statusClass = getStatusClass(contact.status);
    const statusIcon = getStatusIcon(contact.status);
    
    return `
      <tr data-id="${contact._id}" class="${contact.status === 'new' ? 'contact-new' : ''}">
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="contact-avatar">
              ${getInitials(contact.name)}
            </div>
            <div>
              <strong>${contact.name || 'Unknown'}</strong>
              ${contact.phone ? `<div style="font-size: 11px; color: var(--gray);">${contact.phone}</div>` : ''}
            </div>
          </div>
        </td>
        <td>
          <a href="mailto:${contact.email}" style="color: var(--primary); text-decoration: none;">
            ${contact.email}
          </a>
        </td>
        <td>
          <div>
            <strong>${contact.subject || 'No Subject'}</strong>
            <div style="font-size: 12px; color: var(--gray); margin-top: 4px;">
              ${truncateText(contact.message, 60)}
            </div>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <span>${new Date(contact.createdAt).toLocaleDateString()}</span>
            <span style="font-size: 11px; color: var(--gray);">${new Date(contact.createdAt).toLocaleTimeString()}</span>
          </div>
        </td>
        <td>
          <span class="status ${contact.status || 'new'}" 
                onclick="markAsRead('${contact._id}')"
                style="cursor: pointer;">
            <i class="fas ${statusIcon}"></i>
            ${capitalize(contact.status || 'new')}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 5px;">
            <button class="btn btn-sm btn-primary" onclick="viewContact('${contact._id}')" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-success" onclick="replyToContact('${contact._id}')" title="Reply">
              <i class="fas fa-reply"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteContact('${contact._id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==================== VIEW CONTACT DETAILS ====================
window.viewContact = async function(id) {
  try {
    showLoading(true);
    
    const contact = await getMessageById(id);
    
    if (!contact) {
      throw new Error('Contact not found');
    }
    
    // Create modal or expand row
    showContactModal(contact);
    
    // Mark as read if new
    if (contact.status === 'new') {
      await updateMessageStatus(id, 'read');
      await loadContacts(); // Refresh list
    }
    
  } catch (error) {
    console.error('Failed to view contact:', error);
    window.showNotification?.('Failed to load message details', 'error');
  } finally {
    showLoading(false);
  }
};

// ==================== REPLY TO CONTACT ====================
window.replyToContact = async function(id) {
  try {
    const contact = contactsData.find(c => c._id === id) || await getMessageById(id);
    
    if (!contact) {
      throw new Error('Contact not found');
    }
    
    showReplyModal(contact);
    
  } catch (error) {
    console.error('Failed to reply:', error);
    window.showNotification?.('Failed to open reply form', 'error');
  }
};

// ==================== MARK AS READ ====================
window.markAsRead = async function(id) {
  try {
    const contact = contactsData.find(c => c._id === id);
    if (!contact) return;
    
    if (contact.status === 'read' || contact.status === 'replied') {
      return;
    }
    
    await updateMessageStatus(id, 'read');
    
    // Update local data
    contact.status = 'read';
    
    // Refresh table
    renderContactsTable(contactsData);
    
    window.showNotification?.('Message marked as read', 'success');
    
  } catch (error) {
    console.error('Failed to mark as read:', error);
    window.showNotification?.('Failed to update status', 'error');
  }
};

// ==================== DELETE CONTACT ====================
window.deleteContactHandler = async function(id) {
  if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
    return;
  }
  
  try {
    showLoading(true);
    await deleteMessage(id);
    
    // Remove from local data
    const index = contactsData.findIndex(c => c._id === id);
    if (index !== -1) {
      contactsData.splice(index, 1);
      totalContacts--;
    }
    
    renderContactsTable(contactsData);
    updatePagination({ page: currentPage, total: totalContacts });
    updateStats();
    
    window.showNotification?.('Message deleted successfully', 'success');
    
  } catch (error) {
    console.error('Failed to delete contact:', error);
    window.showNotification?.('Failed to delete message', 'error');
  } finally {
    showLoading(false);
  }
};

// ==================== FILTER CONTACTS ====================
window.filterContacts = function() {
  currentPage = 1;
  loadContacts();
};

// ==================== MODAL FUNCTIONS ====================
function showContactModal(contact) {
  // Remove existing modal
  const existingModal = document.getElementById('contactModal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'contactModal';
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border);">
        <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-envelope-open" style="color: var(--primary);"></i>
          Message Details
        </h3>
        <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <label style="font-size: 12px; color: var(--gray);">From</label>
            <p style="margin: 5px 0 0; font-weight: 600;">${contact.name || 'Unknown'}</p>
          </div>
          <div>
            <label style="font-size: 12px; color: var(--gray);">Date</label>
            <p style="margin: 5px 0 0;">${new Date(contact.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <label style="font-size: 12px; color: var(--gray);">Email</label>
            <p style="margin: 5px 0 0;">
              <a href="mailto:${contact.email}" style="color: var(--primary);">${contact.email}</a>
            </p>
          </div>
          <div>
            <label style="font-size: 12px; color: var(--gray);">Phone</label>
            <p style="margin: 5px 0 0;">${contact.phone || 'Not provided'}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="font-size: 12px; color: var(--gray);">Subject</label>
          <p style="margin: 5px 0 0; font-weight: 600;">${contact.subject || 'No Subject'}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="font-size: 12px; color: var(--gray);">Message</label>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 5px;">
            ${contact.message.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn btn-success" onclick="replyToContact('${contact._id}'); this.closest('.modal').remove();">
            <i class="fas fa-reply"></i> Reply
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function showReplyModal(contact) {
  // Remove existing modal
  const existingModal = document.getElementById('replyModal');
  if (existingModal) existingModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'replyModal';
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; width: 90%; max-width: 600px;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border);">
        <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-reply" style="color: var(--success);"></i>
          Reply to ${contact.name}
        </h3>
        <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
      </div>
      
      <div style="padding: 20px;">
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px;">
            <strong>Original Message:</strong><br>
            ${contact.message.substring(0, 100)}${contact.message.length > 100 ? '...' : ''}
          </p>
        </div>
        
        <form id="replyForm">
          <div class="form-group">
            <label for="replyMessage">Your Reply</label>
            <textarea id="replyMessage" class="form-control" rows="6" required 
                      placeholder="Type your reply here..."></textarea>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
              Cancel
            </button>
            <button type="submit" class="btn btn-success" id="sendReplyBtn">
              <i class="fas fa-paper-plane"></i> Send Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add form submit handler
  const form = document.getElementById('replyForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const replyMessage = document.getElementById('replyMessage').value.trim();
    if (!replyMessage) {
      window.showNotification?.('Please enter a reply message', 'warning');
      return;
    }
    
    const sendBtn = document.getElementById('sendReplyBtn');
    
    try {
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      
      await updateMessageStatus(contact._id, 'replied', replyMessage);
      
      modal.remove();
      await loadContacts(); // Refresh list
      
      window.showNotification?.('Reply sent successfully', 'success');
      
    } catch (error) {
      console.error('Failed to send reply:', error);
      window.showNotification?.('Failed to send reply', 'error');
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reply';
    }
  });
}

// ==================== STATS UPDATE ====================
function updateStats() {
  const total = totalContacts || contactsData.length;
  const newCount = contactsData.filter(c => c.status === 'new').length;
  const readCount = contactsData.filter(c => c.status === 'read').length;
  const repliedCount = contactsData.filter(c => c.status === 'replied').length;
  
  // Update dashboard badge if exists
  const contactBadge = document.getElementById('contactBadge');
  if (contactBadge) {
    contactBadge.textContent = newCount;
    contactBadge.style.display = newCount > 0 ? 'inline-block' : 'none';
  }
}

// ==================== PAGINATION ====================
function updatePagination(pagination) {
  if (!pagination) return;
  
  const totalPages = pagination.pages || Math.ceil(totalContacts / itemsPerPage);
  const start = ((currentPage - 1) * itemsPerPage) + 1;
  const end = Math.min(currentPage * itemsPerPage, totalContacts);
  
  const paginationInfo = document.getElementById('paginationInfo');
  if (paginationInfo) {
    paginationInfo.textContent = `Showing ${totalContacts ? start : 0}-${totalContacts ? end : 0} of ${totalContacts} messages`;
  }
  
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  
  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        loadContacts();
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadContacts();
      }
    };
  }
  
  const pageInfo = document.getElementById('currentPage');
  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Filter change
  const filterSelect = document.getElementById('contactFilter');
  if (filterSelect) {
    filterSelect.removeEventListener('change', filterContacts);
    filterSelect.addEventListener('change', filterContacts);
  }
  
  // Refresh button
  const refreshBtn = document.querySelector('button[onclick="loadContacts()"]');
  if (refreshBtn) {
    refreshBtn.removeEventListener('click', loadContacts);
    refreshBtn.addEventListener('click', loadContacts);
  }
}

// ==================== UTILITIES ====================
function getStatusClass(status) {
  const classes = {
    'new': 'status-new',
    'read': 'status-read',
    'replied': 'status-replied'
  };
  return classes[status] || 'status-new';
}

function getStatusIcon(status) {
  const icons = {
    'new': 'fa-circle',
    'read': 'fa-check-circle',
    'replied': 'fa-reply-all'
  };
  return icons[status] || 'fa-circle';
}

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateText(text, length) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}