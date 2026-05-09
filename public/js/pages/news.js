import { getNews, getNewsBySlug } from '../services/api.js';

const BACKEND_URL = 'http://localhost:3000';

let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 9;

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' font-size='16' text-anchor='middle' dy='.3em' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

/* ============================= */
/* NEWS LIST PAGE */
/* ============================= */

export async function initNewsPage() {
  await loadNewsPage(1);
  setupPagination();
}

async function loadNewsPage(page = 1) {
  const container = document.getElementById('news-container');
  if (!container) return;

  container.innerHTML = `<p>Loading news...</p>`;

  try {
    const response = await getNews(page, itemsPerPage);

    let newsArray = [];
    if (Array.isArray(response)) newsArray = response;
    else if (response?.news) newsArray = response.news;
    else if (response?.data) newsArray = response.data;

    if (!newsArray.length) {
      container.innerHTML = `<p>No news available.</p>`;
      return;
    }

    currentPage = page;
    totalPages =
      response?.pagination?.pages ||
      Math.ceil(newsArray.length / itemsPerPage) ||
      1;

    container.innerHTML = newsArray
      .map((item) => {
       const slug = item.slug;

        let imgSrc = PLACEHOLDER_IMAGE;
        if (item.cover) {
          imgSrc = item.cover.startsWith('http')
            ? item.cover
            : `${BACKEND_URL}${item.cover}`;
        }

        const dateStr =
          item.date || item.createdAt || item.publishedAt;

        const formattedDate = dateStr
          ? new Date(dateStr).toLocaleDateString()
          : 'Date unavailable';

        return `
          <div class="news-card">
            <img src="${imgSrc}" 
                 alt="${item.title || 'News image'}"
                 onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">
            <div class="news-content">
              <h3>${item.title || 'Untitled'}</h3>
              <p>${(item.description || item.excerpt || '')
                .substring(0, 150)}...</p>
              <small>${formattedDate}</small>
              <div class="cta-buttons">
                <a href="/pages/news-detail.html?slug=${slug}" class="btn btn-sm">
                  Read More
                </a>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    updatePaginationUI();
  } catch (error) {
    console.error('Failed to load news:', error);
    container.innerHTML = `<p>Error loading news.</p>`;
  }
}

/* ============================= */
/* NEWS DETAIL PAGE */
/* ============================= */

export async function initNewsDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');  // ✅ FIXED

  if (!slug) {
    document.getElementById('news-detail-container').innerHTML =
      `<p>Invalid article link.</p>`;
    return;
  }

  await loadNewsDetail(slug);
}


async function loadNewsDetail(slug) {
  
  const container = document.getElementById('news-detail-container');
  if (!container) return;

  container.innerHTML = `<p>Loading article...</p>`;
  
  try {
    
    const response = await getNewsBySlug(slug);
    const newsItem = response?.data || response;

    if (!newsItem) {
      container.innerHTML = `<p>Article not found.</p>`;
      return;
    }

    let imgSrc = PLACEHOLDER_IMAGE;
    if (newsItem.cover) {
      imgSrc = newsItem.cover.startsWith('http')
        ? newsItem.cover
        : `${BACKEND_URL}${newsItem.cover}`;
    }

    const dateStr =
      newsItem.date ||
      newsItem.createdAt ||
      newsItem.publishedAt;

    const formattedDate = dateStr
      ? new Date(dateStr).toLocaleDateString()
      : 'Date unavailable';

    const content =
      newsItem.body ||
      newsItem.content ||
      newsItem.description ||
      '';

    container.innerHTML = `
      <img src="${imgSrc}" 
           class="news-detail-image"
           onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">
      <h1>${newsItem.title}</h1>
      <div class="news-detail-meta">
        <span>${formattedDate}</span>
        ${newsItem.category ? `<span>${newsItem.category}</span>` : ''}
      </div>
      <div class="news-detail-content">
        ${content
          .split('\n')
          .map((p) => `<p>${p}</p>`)
          .join('')}
      </div>
    `;
  } catch (error) {
    console.error('Failed to load article:', error);
    container.innerHTML = `<p>Error loading article.</p>`;
  }
}

/* ============================= */
/* PAGINATION */
/* ============================= */

function setupPagination() {
  const prev = document.getElementById('prev-page');
  const next = document.getElementById('next-page');

  if (prev)
    prev.onclick = () =>
      currentPage > 1 && loadNewsPage(currentPage - 1);

  if (next)
    next.onclick = () =>
      currentPage < totalPages &&
      loadNewsPage(currentPage + 1);
}

function updatePaginationUI() {
  const pageInfo = document.getElementById('page-info');
  if (pageInfo)
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}
