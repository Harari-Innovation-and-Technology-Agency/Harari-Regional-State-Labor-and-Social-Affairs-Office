/**
 * Contact Page JavaScript
 * Handles contact form submission to backend API
 */

import { submitContact } from '../services/api.js';

export function initContactPage() {
    setupContactForm();
}

function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Get form data
        const formData = {
            name: form.querySelector('[name="name"]')?.value,
            email: form.querySelector('[name="email"]')?.value,
            phone: form.querySelector('[name="phone"]')?.value,
            subject: form.querySelector('[name="subject"]')?.value,
            message: form.querySelector('[name="message"]')?.value
        };
        
        // Basic validation
        if (!formData.name || !formData.email || !formData.message) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            // Submit to backend API
            const response = await submitContact(formData);
            
            // Show success message
            showNotification('Your message has been sent successfully!', 'success');
            
            // Reset form
            form.reset();
            
        } catch (error) {
            console.error('Failed to send message:', error);
            showNotification('Failed to send message. Please try again.', 'error');
            
        } finally {
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}