/**
 * Services Page JavaScript
 * Loads services from API
 */

import { getServices } from '../services/api.js';

export async function initServicesPage() {
    console.log('🔧 Initializing services page...');
    await loadServices();
}

async function loadServices() {
    const container = document.getElementById('services-container');
    if (!container) return;

    try {
        container.innerHTML = `
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <p>Loading services...</p>
            </div>
        `;

        const services = await getServices();

        if (!services || services.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <p>No services available at the moment.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = services.map((service, index) => {

            // Convert description text into list items
            const listItems = service.description
                ? service.description
                    .split(/\n+/)
                    .map(line => `<li>${line.trim()}</li>`)
                    .join('')
                : '<li>No description available</li>';

            return `
                <div class="service-card">
                    <div class="service-header" data-index="${index}">
                        <h3>${service.title}</h3>
                        <i class="fas fa-chevron-down toggle-icon"></i>
                    </div>
                    <div class="service-content">
                        <ul>
                            ${listItems}
                        </ul>
                    </div>
                </div>
            `;
        }).join('');

        // Add toggle functionality
        const headers = document.querySelectorAll('.service-header');

        headers.forEach(header => {
            header.addEventListener('click', () => {
                const card = header.parentElement;
                const content = card.querySelector('.service-content');
                const icon = header.querySelector('.toggle-icon');

                const isOpen = card.classList.contains('active');

                // Close all
                document.querySelectorAll('.service-card').forEach(c => {
                    c.classList.remove('active');
                });

                if (!isOpen) {
                    card.classList.add('active');
                }
            });
        });

    } catch (error) {
        container.innerHTML = `<p>Failed to load services.</p>`;
    }
}