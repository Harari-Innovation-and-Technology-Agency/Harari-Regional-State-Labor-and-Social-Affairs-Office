
import { getGallery, uploadGalleryImage, deleteGalleryItem  } from "../../api.js";

let isInitialized = false;
let currentFilter = '';

// Custom notification system - no jQuery/Toastr dependency
function showNotification(message, type = 'success') {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.custom-notification');
  existingNotifications.forEach(n => n.remove());
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'custom-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  // Set color based on type
  if (type === 'success') {
    notification.style.background = '#28a745';
  } else if (type === 'error') {
    notification.style.background = '#dc3545';
  } else if (type === 'warning') {
    notification.style.background = '#ffc107';
    notification.style.color = '#333';
  }
  
  // Add icon
  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'fas fa-check-circle' : 
                   type === 'error' ? 'fas fa-exclamation-circle' : 
                   'fas fa-exclamation-triangle';
  notification.appendChild(icon);
  
  // Add message
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: inherit;
    font-size: 20px;
    cursor: pointer;
    margin-left: 15px;
    padding: 0 5px;
  `;
  closeBtn.onclick = () => notification.remove();
  notification.appendChild(closeBtn);
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles if not already present
if (!document.querySelector('#notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// Helper functions using custom notifications
function showSuccess(message) {
  showNotification(message, 'success');
}

function showError(message) {
  showNotification(message, 'error');
}

function showWarning(message) {
  showNotification(message, 'warning');
}

export async function initGallery() {
  if (isInitialized) {
    console.log("Gallery already initialized");
    return;
  }
  
  console.log("Initializing gallery...");
  
  try {
    await loadGallery();
    setupEventListeners();
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize gallery:", error);
    showError("Failed to initialize gallery");
  }
}

export function cleanup() {
  console.log("Cleaning up gallery...");
  isInitialized = false;
}

async function loadGallery(filter = '') {
  try {
    const response = await getGallery();
    
    // Your backend might return array directly or wrapped
    const galleryItems = Array.isArray(response) ? response : 
                        (response.images || response.gallery || []);
    
    console.log(`Loaded ${galleryItems.length} gallery items`);
    
    // Filter items if needed
    const filteredItems = filter 
      ? galleryItems.filter(item => item.category === filter)
      : galleryItems;
    
    renderGallery(filteredItems);
    
  } catch (error) {
    console.error("Failed to load gallery:", error);
    showError("Failed to load gallery images");
  }
}


function renderGallery(items) {
  const galleryGrid = document.getElementById("galleryGrid");
  if (!galleryGrid) return;
  
  if (!items || items.length === 0) {
    galleryGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
        <i class="fas fa-images" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
        <h3 style="color: #666; margin-bottom: 10px;">No photos yet</h3>
        <p style="color: #999;">Upload your first photo using the form above</p>
      </div>
    `;
    return;
  }
  
  galleryGrid.innerHTML = items.map(item => {
    const imageUrl = item.src;
    
    // 🚨 CRITICAL FIX: Fetch image as blob to bypass CORS/security headers
    const imageId = `img-${item._id}`;
    
    return `
      <div class="gallery-item" data-id="${item._id}">
        <div style="position: relative; padding-top: 75%; overflow: hidden; border-radius: 8px; background: #f0f0f0;">
          <div id="${imageId}-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
            <div class="spinner-border text-primary" role="status" style="width: 2rem; height: 2rem;">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${item._id}" title="Delete" style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div style="padding: 10px;">
          <p style="margin: 0 0 5px 0; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${item.caption || 'Untitled'}
          </p>
          <p style="margin: 0; font-size: 12px; color: #666;">
            <span class="badge bg-secondary">${item.category || 'Activities'}</span>
          </p>
          <small style="color: #999; display: block; margin-top: 5px;">
            ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
          </small>
        </div>
      </div>
    `;
  }).join('');
  
  // 🚨 CRITICAL FIX: Load all images as blobs after rendering
  items.forEach(item => {
    if (item.src) {
      loadImageAsBlob(item.src, `img-${item._id}-container`);
    }
  });
}

// 🚨 NEW FUNCTION: Fetch image as blob to bypass security headers
function loadImageAsBlob(imagePath, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Clear the loading spinner
  container.innerHTML = '';
  
  // Construct the URL
  const baseServerUrl =  "http://localhost:3000"
  const fullImageUrl = `${baseServerUrl}${imagePath}`;
  
  // Fetch the image as a blob
  fetch(fullImageUrl, {
    method: 'GET',
    cache: 'no-cache',
    credentials: 'same-origin'
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.blob();
  })
  .then(blob => {
    // Create object URL from blob
    const blobUrl = URL.createObjectURL(blob);
    
    // Create img element
    const img = document.createElement('img');
    img.src = blobUrl;
    img.alt = 'Gallery image';
    img.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    `;
    
    // Clear container and append image
    container.innerHTML = '';
    container.appendChild(img);
    
    // Clean up object URL after image loads
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
    };
  })
  .catch(error => {
    console.error('Failed to load image:', imagePath, error);
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f8d7da; color: #721c24; padding: 10px; text-align: center; font-size: 12px;">
        Failed to load image
      </div>
    `;
  });
}

async function handleUpload(e) {
  e.preventDefault();
  
  const fileInput = document.getElementById('galleryImage');
  const caption = document.getElementById('galleryCaption');
  const category = document.getElementById('galleryCategory');
  const alt = document.getElementById('galleryAlt');
  const submitBtn = document.getElementById('gallerySubmitBtn');
  
  if (!fileInput.files || !fileInput.files[0]) {
    showWarning('Please select an image to upload');
    return;
  }
  
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (fileInput.files[0].size > maxSize) {
    showError('File size must be less than 5MB');
    return;
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(fileInput.files[0].type)) {
    showError('Please select a valid image file (JPG, PNG, GIF, WebP)');
    return;
  }
  
  const formData = new FormData();
  formData.append('image', fileInput.files[0]);  // Must match backend field name
  formData.append('caption', caption.value.trim() || 'Untitled');
  formData.append('category', category.value);
  formData.append('alt', alt.value.trim() || caption.value.trim() || 'Gallery image');
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    console.log('Uploading image...', fileInput.files[0].name);
    const response = await uploadGalleryImage(formData);
    console.log('Upload response:', response);
    
    // Reset form
    fileInput.value = '';
    caption.value = '';
    category.value = 'Activities';  // Match your default
    alt.value = '';
    
    const selectedFile = document.getElementById('selectedFile');
    if (selectedFile) {
      selectedFile.style.display = 'none';
      selectedFile.innerHTML = '';
    }
    
    showSuccess('Photo uploaded successfully');
    
    // Reload gallery
    await loadGallery(currentFilter);
    
  } catch (error) {
    console.error('Upload failed:', error);
    showError(error.message || 'Failed to upload photo');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Photo';
  }
}

async function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this image?')) return;
  
  try {
    await deleteGalleryItem(id);
    await loadGallery(currentFilter);
    showSuccess('Photo deleted successfully');
  } catch (error) {
    console.error('Delete failed:', error);
    showError('Failed to delete photo');
  }
}

function setupEventListeners() {
  // File upload area click handler - SINGLE SOURCE OF TRUTH
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInput = document.getElementById('galleryImage');
  
  if (fileUploadArea && fileInput) {
    // Remove any existing listeners first
    fileUploadArea.removeEventListener('click', handleFileUploadClick);
    // Add single click handler
    fileUploadArea.addEventListener('click', handleFileUploadClick);
  }
  
  // File input change handler
  if (fileInput) {
    fileInput.removeEventListener('change', handleFileChange);
    fileInput.addEventListener('change', handleFileChange);
  }
  
  // Form submit handler
  const form = document.getElementById('galleryForm');
  if (form) {
    form.removeEventListener('submit', handleUpload);
    form.addEventListener('submit', handleUpload);
  }
  
  // Filter handler
  const filter = document.getElementById('galleryFilter');
  if (filter) {
    filter.removeEventListener('change', handleFilterChange);
    filter.addEventListener('change', handleFilterChange);
  }
  
  // Delete handler (delegation)
  document.removeEventListener('click', handleDeleteClick);
  document.addEventListener('click', handleDeleteClick);
}

// Separate handler for file upload area click
function handleFileUploadClick(e) {
  // Don't trigger if the click came from the input itself (prevents double dialog)
  if (e.target.id === 'galleryImage' || e.target.tagName === 'INPUT') {
    return;
  }
  
  const fileInput = document.getElementById('galleryImage');
  if (fileInput) {
    e.preventDefault();
    fileInput.click();
  }
}

// Separate handler for file change
function handleFileChange(e) {
  const selectedFile = document.getElementById('selectedFile');
  if (!selectedFile) return;
  
  if (this.files && this.files[0]) {
    selectedFile.style.display = 'block';
    selectedFile.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #e8f5e9; border-radius: 4px; color: #2e7d32;">
        <i class="fas fa-check-circle"></i>
        <span>Selected: <strong>${this.files[0].name}</strong> (${(this.files[0].size / 1024 / 1024).toFixed(2)} MB)</span>
        <button type="button" class="btn-remove-file" 
                style="margin-left: auto; background: none; border: none; color: #2e7d32; cursor: pointer;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add remove file handler
    const removeBtn = selectedFile.querySelector('.btn-remove-file');
    if (removeBtn) {
      removeBtn.onclick = function() {
        fileInput.value = '';
        selectedFile.style.display = 'none';
        selectedFile.innerHTML = '';
      };
    }
  } else {
    selectedFile.style.display = 'none';
    selectedFile.innerHTML = '';
  }
}

function handleFilterChange(e) {
  currentFilter = e.target.value;
  loadGallery(currentFilter);
}

async function handleDeleteClick(e) {
  const deleteBtn = e.target.closest('.delete-btn');
  if (!deleteBtn) return;
  
  const id = deleteBtn.dataset.id;
  if (!id) return;
  
  e.preventDefault();
  await handleDelete(id);
}

// Make loadGallery available globally for the refresh button
window.loadGallery = loadGallery;