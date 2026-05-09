import { getPages, updatePage, getPage, uploadPageImage } from "../../api.js";

let isInitialized = false;
let currentPage = 'about';
let pageData = null;

export async function initPages() {
  if (isInitialized) {
    console.log("Pages already initialized");
    return;
  }
  
  console.log("Initializing pages management...");
  
  try {
    // Make all functions globally available
    window.switchPageTab = switchPageTab;
    window.addValueField = addValueField;
    window.previewPage = previewPage;
    window.togglePublishStatus = togglePublishStatus;
    window.resetForm = resetForm;
    window.viewVersionHistory = viewVersionHistory;
    window.formatText = formatText;
    window.insertList = insertList;
    window.setupHeroImageUpload = setupHeroImageUpload;
    
    await loadPageContent('about');
    setupEventListeners();
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize pages:", error);
    showNotification('Failed to load page content', 'error');
  }
}

export function cleanup() {
  console.log("Cleaning up pages...");
  
  // Clean up global functions
  window.switchPageTab = null;
  window.addValueField = null;
  window.previewPage = null;
  window.togglePublishStatus = null;
  window.resetForm = null;
  window.viewVersionHistory = null;
  window.formatText = null;
  window.insertList = null;
  window.setupHeroImageUpload = null;
  
  isInitialized = false;
}

// ==================== TAB NAVIGATION ====================
async function switchPageTab(pageId) {
  console.log('Switching to page:', pageId);
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
  
  // Update content sections
  document.querySelectorAll('.page-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${pageId}-page`).classList.add('active');
  
  // Load page content
  currentPage = pageId;
  await loadPageContent(pageId);
}

// ==================== LOAD PAGE CONTENT ====================
async function loadPageContent(pageType) {
  try {
    showLoading(true);
    
    // Fetch page data from API
    const response = await getPage(pageType);
    pageData = response.data || response;
    
    console.log(`Loaded ${pageType} page:`, pageData);
    
    // Update form fields
    if (pageData) {
      // Hero section
      if (document.getElementById('pageHeroTitle')) {
        document.getElementById('pageHeroTitle').value = pageData.heroTitle || '';
      }
      
      // Vision & Mission
      if (document.getElementById('pageVision')) {
        document.getElementById('pageVision').value = pageData.vision || '';
      }
      if (document.getElementById('pageMission')) {
        document.getElementById('pageMission').value = pageData.mission || '';
      }
      
      // Core Values
      if (pageData.values && Array.isArray(pageData.values)) {
        renderValues(pageData.values);
      }
      
      // Responsibilities
      if (document.getElementById('pageResponsibilities')) {
        document.getElementById('pageResponsibilities').value = pageData.responsibilities || '';
      }
      
      // SEO
      if (document.getElementById('pageMetaTitle')) {
        document.getElementById('pageMetaTitle').value = pageData.metaTitle || '';
      }
      if (document.getElementById('pageMetaDescription')) {
        document.getElementById('pageMetaDescription').value = pageData.metaDescription || '';
      }
      
      // Status
      if (document.getElementById('pagePublished')) {
        document.getElementById('pagePublished').checked = pageData.isPublished || false;
      }
      
      // Last updated
      if (document.getElementById('pageLastUpdated')) {
        const lastUpdated = pageData.updatedAt ? new Date(pageData.updatedAt).toLocaleString() : 'Never';
        document.getElementById('pageLastUpdated').textContent = lastUpdated;
      }
      
      // Status badge
      if (document.getElementById('pageStatus')) {
        const status = pageData.isPublished ? 'Published' : 'Draft';
        const badgeClass = pageData.isPublished ? 'bg-success' : 'bg-warning';
        document.getElementById('pageStatus').innerHTML = `<span class="badge ${badgeClass}">${status}</span>`;
      }
      
      // Hero image
      if (pageData.heroImage) {
        showHeroImage(pageData.heroImage);
      }
    }
    
  } catch (error) {
    console.error(`Failed to load ${pageType} page:`, error);
    // Don't show error for missing pages - they might not exist yet
    if (error.message !== 'Page not found') {
      showNotification(`Failed to load ${pageType} page`, 'error');
    }
  } finally {
    showLoading(false);
  }
}

// ==================== CORE VALUES MANAGEMENT ====================
function addValueField(value = '') {
  const container = document.getElementById('valuesContainer');
  if (!container) return;
  
  const valueItem = document.createElement('div');
  valueItem.className = 'value-item';
  valueItem.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; animation: slideIn 0.3s ease;';
  
  valueItem.innerHTML = `
    <input type="text" class="form-control" placeholder="e.g., Integrity" value="${value}">
    <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.value-item').remove()">
      <i class="fas fa-trash"></i>
    </button>
  `;
  
  container.appendChild(valueItem);
}

function renderValues(values) {
  const container = document.getElementById('valuesContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (values && values.length > 0) {
    values.forEach(value => {
      addValueField(value);
    });
  } else {
    // Default values
    addValueField('Integrity');
    addValueField('Excellence');
    addValueField('Transparency');
  }
}

// ==================== HERO IMAGE HANDLING ====================
function setupHeroImageUpload() {
  const heroInput = document.getElementById('pageHeroImage');
  const heroPreview = document.getElementById('heroImagePreview');
  const heroName = document.getElementById('heroImageName');
  
  if (heroInput) {
    // Remove existing listener to prevent duplicates
    heroInput.removeEventListener('change', handleHeroImageChange);
    heroInput.addEventListener('change', handleHeroImageChange);
  }
}

async function handleHeroImageChange(e) {
  const heroPreview = document.getElementById('heroImagePreview');
  const heroName = document.getElementById('heroImageName');
  
  if (this.files && this.files[0]) {
    const file = this.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('Please select an image file', 'error');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Image size must be less than 2MB', 'error');
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
      if (heroPreview) {
        heroPreview.style.display = 'block';
        heroPreview.innerHTML = `<img src="${e.target.result}" alt="Hero preview" style="max-width: 200px; max-height: 100px; border-radius: 4px;">`;
      }
    };
    reader.readAsDataURL(file);
    
    if (heroName) {
      heroName.textContent = file.name;
    }
    
    // Auto upload
    await uploadHeroImage(file);
  }
}

async function uploadHeroImage(file) {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('pageType', currentPage);
    
    const response = await uploadPageImage(currentPage, formData);
    showNotification('Hero image uploaded successfully', 'success');
    return response;
  } catch (error) {
    console.error('Failed to upload hero image:', error);
    showNotification('Failed to upload hero image', 'error');
  }
}

function showHeroImage(imageUrl) {
  const heroPreview = document.getElementById('heroImagePreview');
  const heroName = document.getElementById('heroImageName');
  
  if (heroPreview) {
    heroPreview.style.display = 'block';
    heroPreview.innerHTML = `<img src="${imageUrl}" alt="Hero preview" style="max-width: 200px; max-height: 100px; border-radius: 4px;">`;
  }
  
  if (heroName) {
    heroName.textContent = 'Current: ' + imageUrl.split('/').pop();
  }
}

// ==================== RICH TEXT FORMATTING ====================
function formatText(command) {
  const textarea = document.getElementById('pageResponsibilities');
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  
  let formattedText = '';
  switch(command) {
    case 'bold':
      formattedText = `**${selectedText}**`;
      break;
    case 'italic':
      formattedText = `*${selectedText}*`;
      break;
    case 'underline':
      formattedText = `_${selectedText}_`;
      break;
  }
  
  textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
}

function insertList() {
  const textarea = document.getElementById('pageResponsibilities');
  if (!textarea) return;
  
  const start = textarea.selectionStart;
  textarea.value = textarea.value.substring(0, start) + '• ' + textarea.value.substring(start);
}

// ==================== PAGE ACTIONS ====================
function previewPage() {
  // Open preview in new tab
  const previewUrl = `/preview/${currentPage}`;
  window.open(previewUrl, '_blank');
}

async function togglePublishStatus() {
  const checkbox = document.getElementById('pagePublished');
  if (!checkbox) return;
  
  try {
    await updatePublishStatus(checkbox.checked);
    showNotification(`Page ${checkbox.checked ? 'published' : 'unpublished'}`, 'success');
    
    // Update status badge
    const statusEl = document.getElementById('pageStatus');
    if (statusEl) {
      const status = checkbox.checked ? 'Published' : 'Draft';
      const badgeClass = checkbox.checked ? 'bg-success' : 'bg-warning';
      statusEl.innerHTML = `<span class="badge ${badgeClass}">${status}</span>`;
    }
  } catch (error) {
    console.error('Failed to update publish status:', error);
    checkbox.checked = !checkbox.checked; // Revert
    showNotification('Failed to update publish status', 'error');
  }
}

async function updatePublishStatus(isPublished) {
  // API call to update publish status
  const response = await updatePage(currentPage, { isPublished });
  return response;
}

function resetForm() {
  if (confirm('Are you sure you want to reset all changes?')) {
    loadPageContent(currentPage);
    showNotification('Form reset', 'info');
  }
}

function viewVersionHistory() {
  // Navigate to version history page
  window.location.href = `/admin/pages/${currentPage}/history`;
}

// ==================== FORM SUBMISSION ====================
async function handleSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('pagesSubmitBtn');
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    // Collect form data
    const formData = {
      heroTitle: document.getElementById('pageHeroTitle')?.value || '',
      vision: document.getElementById('pageVision')?.value || '',
      mission: document.getElementById('pageMission')?.value || '',
      values: getValuesArray(),
      responsibilities: document.getElementById('pageResponsibilities')?.value || '',
      metaTitle: document.getElementById('pageMetaTitle')?.value || '',
      metaDescription: document.getElementById('pageMetaDescription')?.value || '',
      isPublished: document.getElementById('pagePublished')?.checked || false,
      pageType: currentPage
    };
    
    console.log('Saving page data:', formData);
    
    // API call
    const response = await updatePage(currentPage, formData);
    
    showNotification('Page content saved successfully', 'success');
    
    // Update last updated timestamp
    if (document.getElementById('pageLastUpdated')) {
      document.getElementById('pageLastUpdated').textContent = new Date().toLocaleString();
    }
    
  } catch (error) {
    console.error('Failed to save page:', error);
    showNotification(error.message || 'Failed to save page content', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Content';
  }
}

function getValuesArray() {
  const container = document.getElementById('valuesContainer');
  if (!container) return [];
  
  const inputs = container.querySelectorAll('input[type="text"]');
  return Array.from(inputs).map(input => input.value.trim()).filter(value => value !== '');
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Form submission
  const form = document.getElementById('pagesForm');
  if (form) {
    form.removeEventListener('submit', handleSubmit);
    form.addEventListener('submit', handleSubmit);
  }
  
  // Hero image upload
  setupHeroImageUpload();
  
  // File input click handler
  const heroUploadBtn = document.querySelector('[onclick="document.getElementById(\'pageHeroImage\').click()"]');
  if (heroUploadBtn) {
    heroUploadBtn.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('pageHeroImage').click();
    });
  }
}

// ==================== UTILITIES ====================
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function showNotification(message, type = 'success') {
  if (window.toastr) {
    window.toastr[type](message);
  } else {
    alert(`${type.toUpperCase()}: ${message}`);
  }
}