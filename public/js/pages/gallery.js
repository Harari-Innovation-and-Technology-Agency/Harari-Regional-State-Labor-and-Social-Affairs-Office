/**
 * Gallery Page JavaScript
 * Loads images from API by category
 */

import { getGallery, getGalleryByCategory } from '../services/api.js';

// ✅ DATA URL PLACEHOLDER - No image file needed, no 404 errors
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\' viewBox=\'0 0 400 300\'%3E%3Crect width=\'400\' height=\'300\' fill=\'%23f1f5f9\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'16\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%2364748b\'%3ENo Image%3C/text%3E%3C/svg%3E';

// 📋 SAMPLE GALLERY DATA
const SAMPLE_GALLERY = [
    {
        url: '/assets/images/meeting.jpg',
        caption: 'Quarterly Management Meeting',
        category: 'Meeting'
    },
    {
        url: '/assets/images/act1.jpg',
        caption: 'Community Outreach Program',
        category: 'Activities'
    },
    {
        url: '/assets/images/act2.jpg',
        caption: 'Staff Training Workshop',
        category: 'Activities'
    },
    {
        url: '/assets/images/land.jpg',
        caption: 'Harar Jugol Heritage Site',
        category: 'Regional Landscape'
    }
];

export async function initGalleryPage() {
    console.log('🖼️ Initializing gallery page...');
    await loadAllGallery();
    setupFilters();
}

async function loadAllGallery() {
    console.log('🖼️ Loading all gallery images...');
    
    const container = document.getElementById('gallery-container');
    if (!container) {
        console.error('🖼️ Gallery container not found!');
        return;
    }
    
    await loadAllImages(container);
}

async function loadAllImages(container) {
    try {
        container.innerHTML = `
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <p>Loading gallery...</p>
            </div>
        `;
        
        const images = await getGallery();
        console.log('🖼️ All gallery images:', images);
        
        if (!images || images.length === 0) {
            console.log('🖼️ No images from API, using sample data');
            container.innerHTML = SAMPLE_GALLERY.map(img => `
                <div class="image-card">
                    <img src="${img.url}" 
                         alt="${img.caption}"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';">
                    <p class="image-caption">${img.caption}</p>
                </div>
            `).join('');
            return;
        }
        
        container.innerHTML = images.map(img => `
            <div class="image-card">
                <img src="${img.url || img.src || PLACEHOLDER_IMAGE}" 
                     alt="${img.alt || img.caption || 'Gallery image'}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';">
                ${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('🖼️ Failed to load gallery:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>Failed to load gallery. Please try again later.</p>
            </div>
        `;
    }
}

async function loadGalleryByCategory(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.log(`🖼️ Container ${containerId} not found, skipping`);
        return;
    }
    
    try {
        const images = await getGalleryByCategory(category);
        console.log(`🖼️ ${category} images:`, images);
        
        if (!images || images.length === 0) {
            container.innerHTML = `<p class="no-images">No ${category} images available</p>`;
            return;
        }
        
        container.innerHTML = images.map(img => `
            <div class="image-card">
                <img src="${img.url || img.src || PLACEHOLDER_IMAGE}" 
                     alt="${img.alt || img.caption || category}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';">
                ${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error(`🖼️ Failed to load ${category} images:`, error);
        container.innerHTML = `<p class="error-message">Failed to load ${category} images</p>`;
    }
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const container = document.getElementById('gallery-container');

    if (!buttons.length || !container) return;

    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            // Remove active class from all buttons
            buttons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            const category = button.dataset.filter;

            if (category === 'all') {
                await loadAllImages(container);
            } else {
                try {
                    const images = await getGalleryByCategory(category);

                    if (!images || images.length === 0) {
                        container.innerHTML = `<p class="no-images">No ${category} images available</p>`;
                        return;
                    }

                    container.innerHTML = images.map(img => `
                        <div class="image-card">
                            <img src="${img.url || img.src || PLACEHOLDER_IMAGE}" 
                                 alt="${img.alt || img.caption || category}"
                                 loading="lazy"
                                 onerror="this.onerror=null; this.src='${PLACEHOLDER_IMAGE}';">
                            ${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}
                        </div>
                    `).join('');

                } catch (error) {
                    console.error('Failed to load gallery:', error);
                }
            }
        });
    });
}
