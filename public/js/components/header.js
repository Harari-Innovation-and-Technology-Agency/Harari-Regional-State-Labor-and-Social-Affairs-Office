/**
 * Header Component
 * Dynamically loads the header HTML and initializes its functionality
 */

import { setLanguage } from '../services/i18n.js';

export async function loadHeader() {
    console.log('========== HEADER LOAD DEBUG ==========');
    console.log('1. Current window location:', window.location.href);
    console.log('2. Current pathname:', window.location.pathname);
    console.log('3. Current origin:', window.location.origin);
    
    // Try EVERY possible path combination
    const possiblePaths = [
        // Absolute paths from root
        '/components/header.html',
        '/public/components/header.html',
        '/harari/public/components/header.html',
        
        // Relative paths
        'components/header.html',
        './components/header.html',
        '../components/header.html',
        '../../components/header.html',
        
        // Full URLs
        `${window.location.origin}/components/header.html`,
        `${window.location.origin}/public/components/header.html`,
        
        // Paths based on current location
        window.location.pathname.includes('pages') 
            ? window.location.pathname.replace(/pages\/.*$/, 'components/header.html')
            : 'components/header.html'
    ];
    
    console.log('4. Trying these paths:', possiblePaths);
    
    for (const path of possiblePaths) {
        try {
            console.log(`   Trying: ${path}`);
            const response = await fetch(path);
            
            if (response.ok) {
                const html = await response.text();
                console.log(`   ✅ SUCCESS! Found header at: ${path}`);
                console.log(`   HTML preview: ${html.substring(0, 100)}...`);
                
                // Insert header at the beginning of body
                document.body.insertAdjacentHTML('afterbegin', html);
                
                // Initialize header functionality
                initHeader();
                console.log('========== HEADER LOAD COMPLETE ==========');
                return;
            } else {
                console.log(`   ❌ Failed (${response.status}): ${path}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${path} - ${error.message}`);
        }
    }
    
    console.error('❌ ALL PATHS FAILED - Could not load header!');
    console.log('========== DEBUG END ==========');
    
    // FALLBACK: Create a minimal header so the page still works
    createFallbackHeader();
}

function createFallbackHeader() {
    console.log('Creating fallback header...');
    const fallbackHeader = `
        <header class="site-header">
            <div class="container">
                <div class="header-content">
                    <div class="logo">
                        <a href="index.html">
                            <img src="assets/images/orglogo.jpg" alt="Logo">
                        </a>
                        <span>Harari Regional State Labor and Social Affairs Office</span>
                    </div>
                    <nav class="nav-links">
                        <a href="index.html">Home</a>
                        <a href="pages/about.html">About</a>
                        <a href="pages/service.html">Services</a>
                        <a href="pages/news.html">News</a>
                        <a href="pages/address.html">Contact</a>
                    </nav>
                </div>
            </div>
        </header>
    `;
    document.body.insertAdjacentHTML('afterbegin', fallbackHeader);
}

function initHeader() {
    // Your existing initHeader code...
    console.log('Initializing header functionality...');
    
    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Language dropdown
    const langToggle = document.getElementById('language-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', function() {
            document.querySelector('.language-dropdown')?.classList.toggle('active');
        });
    }
    
    // Language selection
    document.querySelectorAll('.language-options button').forEach(button => {
        button.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            setLanguage(lang);
            document.querySelector('.language-dropdown')?.classList.remove('active');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
       if (!event.target.closest('.nav-links') &&
        !event.target.closest('#hamburger')) {
        navLinks?.classList.remove('active');
        hamburger?.classList.remove('active');
    }

    if (!event.target.closest('.language-dropdown')) {
        document.querySelector('.language-dropdown')?.classList.remove('active');
    }
    });
    
    // Load saved language preference
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
        setLanguage(savedLang);
    }
}