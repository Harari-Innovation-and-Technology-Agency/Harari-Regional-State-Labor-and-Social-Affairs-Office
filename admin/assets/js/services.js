import {
  getServices,
  createService,
  updateService,
  deleteService
} from "../../api.js";

let isInitialized = false;
let servicesData = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalServices = 0;

let editMode = false;
let currentServiceId = null;

/* ================= INIT ================= */

export async function initServices() {
  if (isInitialized) return;

  window.editService = editService;
  window.deleteServiceHandler = deleteServiceHandler;

  await loadServices();

  setTimeout(setupEventListeners, 50);

  isInitialized = true;
}

export function cleanup() {
  window.editService = null;
  window.deleteServiceHandler = null;
  isInitialized = false;
}

/* ================= LOAD ================= */

async function loadServices() {
  try {
    showLoading(true);

    const response = await getServices();

    servicesData = Array.isArray(response)
      ? response
      : response?.data || [];

    totalServices = servicesData.length;

    renderTable(paginate(servicesData));
    updateStats();
    updatePagination();

  } catch (error) {
    console.error("Load services error:", error);
    showNotification("Failed to load services", "error");
  } finally {
    showLoading(false);
  }
}

/* ================= PAGINATION ================= */

function paginate(data) {
  const start = (currentPage - 1) * itemsPerPage;
  return data.slice(start, start + itemsPerPage);
}

function updatePagination() {
  const totalPages = Math.ceil(totalServices / itemsPerPage) || 1;

  const pageEl = document.getElementById("currentPage");
  if (pageEl) {
    pageEl.textContent = `Page ${currentPage} of ${totalPages}`;
  }
}

/* ================= RENDER ================= */

function renderTable(services) {
  const tbody = document.getElementById("serviceTableBody");
  if (!tbody) return;

  if (!services.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:30px;">
          No services found
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = services.map(service => `
    <tr>
      <td><strong>${service.title}</strong></td>
      <td>${service.category}</td>
      <td>${truncate(service.description, 100)}</td>
      <td>
        <span class="status-badge ${
          service.status === "Available"
            ? "status-active"
            : "status-inactive"
        }">
          ${service.status}
        </span>
      </td>
      <td style="white-space:nowrap;">
        <button class="btn btn-sm btn-primary"
          onclick="editService('${service._id}')">
          Edit
        </button>
        <button class="btn btn-sm btn-danger"
          onclick="deleteServiceHandler('${service._id}')">
          Delete
        </button>
      </td>
    </tr>
  `).join("");
}

/* ================= SUBMIT ================= */

async function handleSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("serviceTitle").value.trim();
  const description = document.getElementById("serviceDescription").value.trim();
  const category = document.getElementById("serviceCategory").value;
  const status = document.getElementById("serviceStatus").value;

  if (!title || !description || !category || !status) {
    showNotification("All fields are required", "warning");
    return;
  }

  const serviceData = {
    title,
    description,
    category,
    status
  };

  try {
    if (editMode && currentServiceId) {
      await updateService(currentServiceId, serviceData);
      showNotification("Service updated", "success");
    } else {
      await createService(serviceData);
      showNotification("Service created", "success");
    }

    resetForm(false);
    await loadServices();

  } catch (error) {
    console.error(error);
    showNotification("Failed to save service", "error");
  }
}

/* ================= EDIT ================= */

function editService(id) {
  const service = servicesData.find(s => s._id === id);
  if (!service) return;

  document.getElementById("serviceId").value = service._id;
  document.getElementById("serviceTitle").value = service.title;
  document.getElementById("serviceCategory").value = service.category;
  document.getElementById("serviceDescription").value = service.description;
  document.getElementById("serviceStatus").value = service.status;

  editMode = true;
  currentServiceId = id;
}

/* ================= DELETE ================= */

async function deleteServiceHandler(id) {
  if (!confirm("Delete this service?")) return;

  try {
    await deleteService(id);
    showNotification("Service deleted", "success");
    await loadServices();
  } catch {
    showNotification("Failed to delete", "error");
  }
}

/* ================= STATS ================= */

function updateStats() {
  const totalEl = document.getElementById("totalServicesCount");
  const availableEl = document.getElementById("availableServicesCount");
  const suspendedEl = document.getElementById("suspendedServicesCount");

  if (totalEl) totalEl.textContent = servicesData.length;

  if (availableEl) {
    availableEl.textContent =
      servicesData.filter(s => s.status === "Available").length;
  }

  if (suspendedEl) {
    suspendedEl.textContent =
      servicesData.filter(s => s.status === "Suspended").length;
  }
}

/* ================= HELPERS ================= */

function resetForm(showMessage = false) {
  const form = document.getElementById("serviceForm");
  if (form) form.reset();

  editMode = false;
  currentServiceId = null;

  const idField = document.getElementById("serviceId");
  if (idField) idField.value = "";

  if (showMessage) {
    showNotification("Form cleared", "success");
  }
}

function setupEventListeners() {
  const form = document.getElementById("serviceForm");
  if (form) form.addEventListener("submit", handleSubmit);

  const clearBtn = document.getElementById("resetServiceForm");
  if (clearBtn) clearBtn.onclick = () => resetForm(true);
}

function truncate(text, len) {
  if (!text) return "";
  return text.length > len ? text.substring(0, len) + "..." : text;
}

function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.style.display = show ? "flex" : "none";
}

function showNotification(message, type = "success") {
  if (window.toastr) {
    window.toastr[type](message);
  } else {
    alert(message);
  }
}
