import {
  uploadPlan,
  uploadReport,
  getAllPlansReports,
  deletePlanReport
} from "../../api.js";

/* ================= INIT ================= */

export async function initPlanReport() {
  setupEvents();
  await loadFiles();
}

/* ================= EVENTS ================= */

function setupEvents() {

  document
    .getElementById("planUploadForm")
    ?.addEventListener("submit", handlePlanUpload);

  document
    .getElementById("reportUploadForm")
    ?.addEventListener("submit", handleReportUpload);

}

/* ================= UPLOAD PLAN ================= */

async function handlePlanUpload(e) {
  e.preventDefault();

  const title = document.getElementById("planTitle").value;
  const file = document.getElementById("planFile").files[0];

  if (!title || !file) return alert("Fill all fields");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  // ⭐ REQUIRED FOR BACKEND
  formData.append("type", "plan");

  try {
    await uploadPlan(formData);
    alert("Plan uploaded");

    e.target.reset();
    loadFiles();

  } catch (err) {
    alert("Upload failed");
  }
}

/* ================= UPLOAD REPORT ================= */

async function handleReportUpload(e) {
  e.preventDefault();

  const title = document.getElementById("reportTitle").value;
  const file = document.getElementById("reportFile").files[0];

  if (!title || !file) return alert("Fill all fields");

  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  // ⭐ REQUIRED FOR BACKEND
  formData.append("type", "report");

  try {
    await uploadReport(formData);
    alert("Report uploaded");

    e.target.reset();
    loadFiles();

  } catch (err) {
    alert("Upload failed");
  }
}

/* ================= LOAD FILES ================= */

async function loadFiles() {
  try {
    const res = await getAllPlansReports();

    // handle { success:true, data:[] } OR direct array
    const data = res.data || res || [];

    renderTable(data);

  } catch {
    alert("Failed to load files");
  }
}

/* ================= RENDER ================= */

function renderTable(items) {
  const tbody = document.getElementById("planReportTableBody");
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;padding:20px;">
          No files uploaded yet
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td>${item.type}</td>
      <td>${item.title}</td>
      <td>
        <a href="${item.fileUrl}" target="_blank">
          View File
        </a>
      </td>
      <td>
        <button class="btn btn-sm btn-danger"
          onclick="deleteFile('${item._id}')">
          Delete
        </button>
      </td>
    </tr>
  `).join("");

  window.deleteFile = deleteFile;
}

/* ================= DELETE ================= */

async function deleteFile(id) {
  if (!confirm("Delete this file?")) return;

  try {
    await deletePlanReport(id);
    loadFiles();
  } catch {
    alert("Delete failed");
  }
}
