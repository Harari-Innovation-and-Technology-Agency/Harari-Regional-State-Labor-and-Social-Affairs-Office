/**
 * API Service - Backend Integration
 * Handles all API calls to the backend
 */

const API_BASE = 'http://localhost:3000/api';

async function apiRequest(endpoint, options = {}) {
    try {
        const url = `${API_BASE}${endpoint}`;
        console.log(`🔵 API Request: ${options.method || 'GET'} ${url}`);
        console.log('   Headers:', options.headers);
        console.log('   Body:', options.body);
         const isFormData = options.body instanceof FormData;
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
            body: options.body ? JSON.stringify(options.body) : null
        });
        
        console.log(`🟡 API Response Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`🔴 API Error ${response.status}:`, errorText);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`🟢 API Response Data:`, data);
        return data;
    } catch (error) {
        console.error(`🔴 API Error (${endpoint}):`, error.message);
        throw error;
    }
}

// ==================== NEWS API ====================

// Get all published news (paginated)
export async function getNews(page = 1, limit = 10) {
    console.log(`📰 Fetching news - page: ${page}, limit: ${limit}`);
    
    try {
        const data = await apiRequest(`/news?page=${page}&limit=${limit}`);
        console.log('📰 News data received:', data);
        return data;
    } catch (error) {
        console.error('📰 Failed to fetch news:', error);
        return { news: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
}


// ✅ Get single news by SLUG (NOT ID anymore)
export async function getNewsBySlug(slug) {
    console.log(`📰 Fetching news by slug: ${slug}`);
    
    try {
        const data = await apiRequest(`/news/slug/${slug}`);
        console.log('📰 News by slug received:', data);
        return data;
    } catch (error) {
        console.error(`📰 Failed to fetch news ${slug}:`, error);
        throw error;
    }
}


// ==================== GALLERY API ====================
export async function getGallery() {
    console.log('🖼️ Fetching gallery...');
    try {
        const data = await apiRequest('/gallery');
        console.log('🖼️ Gallery data received:', data);
        return data.images || data.data || data || [];
    } catch (error) {
        console.error('🖼️ Failed to fetch gallery:', error);
        return [];
    }
}

export async function getGalleryByCategory(category) {
    console.log(`🖼️ Fetching gallery by category: ${category}`);
    try {
        const data = await apiRequest(`/gallery?category=${encodeURIComponent(category)}`);
        console.log(`🖼️ Gallery data for ${category}:`, data);
        return data.images || data.data || data || [];
    } catch (error) {
        console.error(`🖼️ Failed to fetch gallery for ${category}:`, error);
        return [];
    }
}

// ==================== SERVICES API ====================
export async function getServices() {
    console.log('🔧 Fetching services...');
    try {
        const data = await apiRequest('/services');

        // Ensure always array
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error('🔧 Failed to fetch services:', error);
        return [];
    }
}

// ==================== CONTACT API ====================
export async function submitContact(formData) {
    console.log('📬 Submitting contact form:', formData);
    try {
        const response = await apiRequest('/contact', {
            method: 'POST',
            body: formData
        });
        console.log('📬 Contact form submitted:', response);
        return response;
    } catch (error) {
        console.error('📬 Failed to submit contact form:', error);
        throw error;
    }
}

// ==================== PAGES API ====================
export async function getPage(pageType) {
    console.log(`📄 Fetching page: ${pageType}`);
    try {
        const data = await apiRequest(`/pages/${pageType}`);
        return data;
    } catch (error) {
        console.error(`📄 Failed to fetch page ${pageType}:`, error);
        return null;
    }
}

// ==================== SETTINGS API ====================
export async function getSettings() {
    console.log('⚙️ Fetching settings...');
    try {
        const data = await apiRequest('/settings');
        return data;
    } catch (error) {
        console.error('⚙️ Failed to fetch settings:', error);
        return null;
    }
}

// ==================== PLANS & REPORTS API ====================
export async function getDocuments() {
    console.log('📄 Fetching plans & reports...');
    try {
        const data = await apiRequest('/planning');

        // Ensure always array
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('📄 Failed to fetch plans & reports:', error);
        return [];
    }
}

// Export all functions as default object
export default {
    getNews,
    getGallery,
    getGalleryByCategory,
    getServices,
    submitContact,
    getPage,
    getSettings,
    getNewsBySlug,
    getDocuments
};