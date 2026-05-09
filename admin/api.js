/* =====================================================
   API CONFIG
===================================================== */
export const API_BASE = "http://localhost:3000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function apiRequest(endpoint, options = {}) {
  try {
    const baseUrl = API_BASE.endsWith('/') 
      ? API_BASE.slice(0, -1) 
      : API_BASE;
    
    const cleanEndpoint = endpoint.startsWith('/') 
      ? endpoint.slice(1) 
      : endpoint;
    
    const url = `${baseUrl}/${cleanEndpoint}`;
    
    console.log(`📡 API Request URL: ${url}`);
    
    const isFormData = options.body instanceof FormData;

const response = await fetch(url, {
  method: options.method || "GET",
  headers: {
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {})
  },
  body: options.body
    ? (isFormData ? options.body : JSON.stringify(options.body))
    : null
});
    console.log(`📡 API Response: ${response}`);

    console.log(`📡 API Response Status: ${response.status}`);

    let data;
    try {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.warn("⚠️ Non-JSON response:", text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
    } catch (parseError) {
      console.error("❌ Failed to parse response:", parseError);
      throw new Error(`Server error (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
    
  } catch (error) {
    console.error("❌ API ERROR:", error.message);
    
    // ✅ REMOVED TOASTR - Use custom event for notifications
    // Dispatch a custom event that our components can listen for
    const notificationEvent = new CustomEvent('api-notification', {
      detail: {
        message: error.message,
        type: 'error'
      }
    });
    window.dispatchEvent(notificationEvent);
    
    // Also try to call showNotification if it exists in global scope
    if (typeof window.showNotification === 'function') {
      window.showNotification(error.message, 'error');
    }
    
    throw error;
  }
}

/* =====================================================
   DASHBOARD
===================================================== */
export const getDashboardStats = () =>
  apiRequest("/admin/stats");

export const getRecentActivity = () =>
  apiRequest("/admin/activity");



/* =====================================================
   NEWS
===================================================== */

// ================= ADMIN =================

// ✅ Admin: Get All (All Status)
export const getAdminNews = () =>
  apiRequest("/news/admin/all");

// ✅ Admin: Get Single by ID (for edit)
export const getNewsById = (id) =>
  apiRequest(`/news/admin/${id}`);

// ✅ Create (supports FormData for image upload)
export const createNews = (payload) =>
  apiRequest("/news", {
    method: "POST",
    body: payload
  });

// ✅ Update (supports FormData)
export const updateNews = (id, payload) =>
  apiRequest(`/news/${id}`, {
    method: "PUT",
    body: payload
  });

// ✅ Delete
export const deleteNews = (id) =>
  apiRequest(`/news/${id}`, {
    method: "DELETE"
  });


/* =====================================================
   PAGES
===================================================== */
export const getPages = () =>
  apiRequest("/pages");

export const createPage = (payload) =>
  apiRequest("/pages", {
    method: "POST",
    body: payload
  });


export const deletePage = (id) =>
  apiRequest(`/pages/${id}`, {
    method: "DELETE"
  });

export const getPage = (pageType) =>
  apiRequest(`/pages/${pageType}`);

export const updatePage = (pageType, payload) =>
  apiRequest(`/pages/${pageType}`, {
    method: "PUT",
    body: payload
  });

export const uploadPageImage = (formData) =>
  fetch(`${API_BASE}/pages/${pageType}/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`
    },
    body: formData
  }).then(res => res.json());

  

/* =====================================================
   SERVICES
===================================================== */
export const getServices = () =>
  apiRequest("/services/admin");

export const createService = (payload) =>
  apiRequest("/services", {
    method: "POST",
    body: payload
  });

export const updateService = (id, payload) =>
  apiRequest(`/services/${id}`, {
    method: "PUT",
    body: payload
  });

export const deleteService = (id) =>
  apiRequest(`/services/${id}`, {
    method: "DELETE"
  });


/* =====================================================
   GALLERY (FILE UPLOAD READY)
===================================================== */
export const getGallery = async () => {
  try {
    const response = await apiRequest("/gallery");
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;  // Direct array of gallery items
    } else if (response && Array.isArray(response.images)) {
      return response.images;  // { images: [...] }
    } else if (response && response.data && Array.isArray(response.data)) {
      return response.data;  // { data: [...] }
    } else if (response && response.gallery) {
      return response.gallery;  // { gallery: [...] }
    }
    
    console.warn("Unexpected gallery response format:", response);
    return [];
  } catch (error) {
    console.error("Failed to fetch gallery:", error);
    throw error;
  }
};

export const deleteGalleryItem = (id) =>
  apiRequest(`/gallery/${id}`, {
    method: "DELETE"
  });

export const uploadGalleryImage = async (formData) => {
  try {
    const response = await fetch(`${API_BASE}/gallery`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
        // Don't set Content-Type - browser sets it with boundary for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `Upload failed with status ${response.status}` 
      }));
      throw new Error(error.message || "Upload failed");
    }

    const data = await response.json();
    return data; // Returns the gallery item directly
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/* =====================================================
   CONTACTS / MESSAGES
===================================================== */
export const getMessages = async (status = '', page = 1, limit = 10) => {
  let endpoint = '/contact';
  const params = new URLSearchParams();
  
  if (status) params.append('status', status);
  params.append('page', page);
  params.append('limit', limit);
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  
  return apiRequest(endpoint);
};

export const getMessageById = (id) =>
  apiRequest(`/contact/${id}`);

export const updateMessageStatus = (id, status, replyMessage = '') => {
  const payload = { status };
  if (replyMessage) payload.replyMessage = replyMessage;
  
  return apiRequest(`/contact/${id}`, {
    method: "PUT",
    body: payload
  });
};

export const deleteMessage = (id) =>
  apiRequest(`/contact/${id}`, {
    method: "DELETE"
  });

/* =====================================================
   USERS
===================================================== */
export const getUsers = () =>
  apiRequest("/users");

export const getUserById = (id) =>
  apiRequest(`/users/${id}`);

export const createUser = (payload) =>
  apiRequest("/users", {
    method: "POST",
    body: payload
  });

export const updateUser = (id, payload) =>
  apiRequest(`/users/${id}`, {
    method: "PUT",
    body: payload
  });

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, {
    method: "DELETE"
  });

export const getMyProfile = () =>
  apiRequest("/users/profile/me");

export const updateMyProfile = (payload) =>
  apiRequest("/users/profile/me", {
    method: "PUT",
    body: payload
  });

/* =====================================================
   SETTINGS
===================================================== */
export const getSettings = () =>
  apiRequest("/settings");

export const updateSettings = (payload) =>
  apiRequest("/settings", {
    method: "PUT",
    body: payload
  });

/* =====================================================
   AUTH
===================================================== */

export function logout() {
  // Clear localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // Use your global notification system if available
  if (window.showNotification) {
    window.showNotification("Logged out successfully", 'success');
  }
  
  // Force immediate redirect
  window.location.replace("http://localhost:3000/admin/admin-login.html");
}

/* =====================================================
   PLAN & REPORT
===================================================== */

// Upload Plan
export const uploadPlan = (data) =>
  apiRequest("/planning/upload", {
    method: "POST",
    body: data // FormData (apiRequest already handles it)
  });

// Upload Report
export const uploadReport = (data) =>
  apiRequest("/planning/upload", {
    method: "POST",
    body: data
  });

// Get All Plans & Reports
export const getAllPlansReports = () =>
  apiRequest("/planning/admin");

// Delete Plan / Report
export const deletePlanReport = (id) =>
  apiRequest(`/planning/${id}`, {
    method: "DELETE"
  });

