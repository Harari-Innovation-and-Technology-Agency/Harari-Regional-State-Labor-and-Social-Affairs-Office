/**
 * Plans & Reports Page JavaScript
 * Loads plans and reports from API
 */

import { getDocuments } from '../services/api.js';

export async function initPlanReportPage() {
    console.log('📄 Initializing Plans & Reports page...');
    await loadDocuments();
}

async function loadDocuments() {
    const container = document.getElementById('documents-container');
    if (!container) return;

    try {
        // Loading state
        container.innerHTML = `
            <div class="loading-spinner-container">
                <div class="loading-spinner"></div>
                <p>Loading documents...</p>
            </div>
        `;

        const documents = await getDocuments();

        if (!documents || documents.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <p>No plans or reports available at the moment.</p>
                </div>
            `;
            return;
        }

        // Render documents
        container.innerHTML = documents.map((doc) => {
            return `
                <div class="service-card">
                    <div class="service-header">
                        <h3>${doc.title}</h3>
                        <div>
                            <span class="doc-type">${doc.type?.toUpperCase()}</span>
                            ${doc.year ? `<span class="doc-year">${doc.year}</span>` : ''}
                            <i class="fas fa-chevron-down toggle-icon"></i>
                        </div>
                    </div>

                    <div class="service-content">
                        <a href="${doc.fileUrl}" target="_blank" class="download-btn">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        // Accordion toggle (same behavior as services)
        const headers = document.querySelectorAll('.service-header');

        headers.forEach(header => {
            header.addEventListener('click', () => {
                const card = header.parentElement;
                const isOpen = card.classList.contains('active');

                // Close all cards
                document.querySelectorAll('.service-card')
                    .forEach(c => c.classList.remove('active'));

                if (!isOpen) {
                    card.classList.add('active');
                }
            });
        });

    } catch (error) {
        console.error('📄 Error loading documents:', error);
        container.innerHTML = `
            <div class="error-message">
                Failed to load plans & reports.
            </div>
        `;
    }
}