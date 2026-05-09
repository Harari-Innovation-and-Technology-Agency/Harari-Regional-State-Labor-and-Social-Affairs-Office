// /admin/assets/js/news.js
import {
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getAdminNews
} from "../../api.js";

let isInitialized = false;

export async function initNews() {
  if (isInitialized) return;

  try {
    setupEventListeners();
    setTodayDate();
    await loadNews();
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize news:", error);
  }
}

export function cleanup() {
  document.removeEventListener("click", handleTableActions);

  const form = document.getElementById("newsForm");
  if (form) form.removeEventListener("submit", handleSubmit);

  const resetBtn = document.getElementById("resetNewsForm");
  if (resetBtn) resetBtn.removeEventListener("click", handleReset);

  isInitialized = false;
}

/* =====================================================
   LOAD NEWS
===================================================== */
async function loadNews() {
  try {
    const news = await getAdminNews();
    const tbody = document.getElementById("newsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!news || news.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:20px;">
            No news articles found.
          </td>
        </tr>
      `;
      return;
    }

    news.forEach((item) => {
      const row = document.createElement("tr");

      let badgeClass = "badge-draft";
      if (item.status === "Under Review") badgeClass = "badge-review";
      if (item.status === "Published") badgeClass = "badge-published";

      row.innerHTML = `
        <td>
  ${
    item.cover
      ? `<img 
           src="http://localhost:3000${item.cover}" 
           alt="Cover"
           style="width:60px;height:40px;object-fit:cover;border-radius:6px;"
         />`
      : `<div style="width:60px;height:40px;background:#f1f1f1;border-radius:6px;"></div>`
  }
</td>

        <td><strong>${item.title}</strong></td>
        <td>${item.category || "—"}</td>
        <td>${formatDate(item.date)}</td>
        <td>
          <span class="badge ${badgeClass}">
            ${item.status || "Draft"}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary edit-btn" data-id="${item._id}">
            Edit
          </button>
          <button class="btn btn-sm btn-danger delete-btn" data-id="${item._id}">
            Delete
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });

  } catch (error) {
    console.error("Failed to load news:", error);
  }
}

/* =====================================================
   FORMAT DATE
===================================================== */
function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
}

/* =====================================================
   EVENT LISTENERS
===================================================== */
function setupEventListeners() {
  document.addEventListener("click", handleTableActions);

  const form = document.getElementById("newsForm");
  if (form) form.addEventListener("submit", handleSubmit);

  const resetBtn = document.getElementById("resetNewsForm");
  if (resetBtn) resetBtn.addEventListener("click", handleReset);
}

/* =====================================================
   HANDLE CREATE / UPDATE
===================================================== */
async function handleSubmit(e) {
  e.preventDefault();

  const id = document.getElementById("newsId").value;

  const fileInput = document.getElementById("newsCover");
  const file = fileInput ? fileInput.files[0] : null;

  const formData = new FormData();

  formData.append("title", document.getElementById("newsTitle").value.trim());
  formData.append("category", document.getElementById("newsCategory").value);
  formData.append("date", document.getElementById("newsDate").value);
  formData.append("summary", document.getElementById("newsExcerpt").value.trim());
  formData.append("content", document.getElementById("newsBody").value.trim());
  formData.append("status", document.getElementById("newsStatus").value);

  if (file) {
    formData.append("cover", file); // 🔥 THIS IS THE IMPORTANT PART
  }

  if (!formData.get("title") || !formData.get("content")) {
    alert("Title and Content are required.");
    return;
  }

  try {
    if (id) {
      await updateNews(id, formData);
      alert("Article updated successfully");
    } else {
      await createNews(formData);
      alert("Article created successfully");
    }

    handleReset();
    await loadNews();

  } catch (error) {
    console.error("Save failed:", error);
    alert("Failed to save article");
  }
}


/* =====================================================
   TABLE ACTIONS (EDIT + DELETE)
===================================================== */
async function handleTableActions(e) {
  const deleteBtn = e.target.closest(".delete-btn");
  const editBtn = e.target.closest(".edit-btn");

  /* ================= DELETE ================= */
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (!id) return;

    if (confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteNews(id);
        await loadNews();
        alert("Article deleted successfully");
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete article");
      }
    }
  }

  /* ================= EDIT ================= */
  if (editBtn) {
    const id = editBtn.dataset.id;
    if (!id) return;

    try {
      const item = await getNewsById(id);  // ✅ FIXED

      if (!item) return;

      document.getElementById("newsId").value = item._id;
      document.getElementById("newsTitle").value = item.title || "";
      document.getElementById("newsCategory").value =
        item.category || "Announcement";
      document.getElementById("newsDate").value =
        item.date ? item.date.split("T")[0] : "";
      document.getElementById("newsExcerpt").value = item.summary || "";
      document.getElementById("newsBody").value = item.content || "";
      document.getElementById("newsStatus").value =
        item.status || "Draft";

      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (error) {
      console.error("Failed to load article:", error);
      alert("Failed to load article for editing");
    }
  }
}


/* =====================================================
   CLEAR FORM
===================================================== */
function handleReset(e) {
  if (e) e.preventDefault();

  const form = document.getElementById("newsForm");
  if (!form) return;

  form.reset();

  document.getElementById("newsId").value = "";
  setTodayDate();
}

/* =====================================================
   AUTO SET TODAY DATE
===================================================== */
function setTodayDate() {
  const dateInput = document.getElementById("newsDate");
  if (!dateInput) return;

  const today = new Date();
  dateInput.value = today.toISOString().split("T")[0];
}
