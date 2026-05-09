import { getNews } from '../services/api.js';

const BACKEND_URL = 'http://localhost:3000';

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' font-size='16' text-anchor='middle' dy='.3em' fill='%2364748b'%3ENo Image%3C/text%3E%3C/svg%3E";

export async function initHomePage() {
  await loadHomeNews();
}

async function loadHomeNews() {
  const container = document.getElementById(
    'home-news-container'
  );
  if (!container) return;

  container.innerHTML = `<p>Loading latest news...</p>`;

  try {
    const response = await getNews(1, 3);

    let newsArray = [];
    if (Array.isArray(response)) newsArray = response;
    else if (response?.news) newsArray = response.news;
    else if (response?.data) newsArray = response.data;

    if (!newsArray.length) {
      container.innerHTML = `<p>No news available.</p>`;
      return;
    }

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
          item.date || item.createdAt;

        const formattedDate = dateStr
          ? new Date(dateStr).toLocaleDateString()
          : 'Date unavailable';

        const description =
          item.description ||
          item.excerpt ||
          '';

        return `
          <div class="news-card">
            <img src="${imgSrc}" 
                 alt="${item.title}"
                 onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">
            <div class="news-content">
              <h3>${item.title}</h3>
              <p>${description.substring(0, 100)}...</p>
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
  } catch (error) {
    console.error('Failed to load homepage news:', error);
    container.innerHTML = `<p>Error loading news.</p>`;
  }
}
