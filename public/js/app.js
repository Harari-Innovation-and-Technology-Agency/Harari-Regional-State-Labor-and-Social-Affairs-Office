/**
 * Main Application Entry Point
 * Loads shared components and initializes page-specific functionality
 */

import { loadHeader } from './components/header.js';
import { loadFooter } from './components/footer.js';
import { loadChatbot } from './components/chatbot.js';
import { setLanguage } from './services/i18n.js';


// Initialize application
async function initApp() {
    console.log('🚀 Initializing app...');
    console.log('📍 Current path:', window.location.pathname);
    
    try {
        // Load shared components
        await loadHeader();
        await loadFooter();
        await loadChatbot();
        
        // Load saved language preference
        const savedLang = localStorage.getItem('language');
        if (savedLang) {
            setLanguage(savedLang);
        }
        
        // Initialize page-specific functionality
        await initPage();
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
    }
}

// Page-specific initialization
async function initPage() {
    const path = window.location.pathname;
    const fullUrl = window.location.href;

    console.log('📄 Current page path:', path);
    console.log('🌐 Full URL:', fullUrl);
    console.log('🔎 Search params:', window.location.search);

    try {
        // 🔥 NEWS DETAIL (most specific first)
        if (path.includes('news-detail')) {
            console.log('📰 Loading news detail page...');
            const { initNewsDetailPage } = await import('/js/pages/news.js');
            await initNewsDetailPage();
            return;
        }

        // 🔥 NEWS LIST
        if (path.includes('news')) {
            console.log('📰 Loading news page...');
            const { initNewsPage } = await import('/js/pages/news.js');
            await initNewsPage();
            return;
        }

        // 🔥 HOMEPAGE
        if (path === '/' || path.includes('index')) {
            console.log('🏠 Loading homepage...');
            const { initHomePage } = await import('/js/pages/home.js');
            await initHomePage();
            return;
        }

        // 🔥 GALLERY
        if (path.includes('photogallary')) {
            console.log('🖼️ Loading gallery page...');
            const { initGalleryPage } = await import('/js/pages/gallery.js');
            await initGalleryPage();
            return;
        }

        // 🔥 SERVICES
        if (path.includes('service')) {
            console.log('🔧 Loading services page...');
            const { initServicesPage } = await import('/js/pages/services.js');
            await initServicesPage();
            return;
        }
        
         if (path.includes('plan')) {
            console.log('🔧 Loading plan and report page...');
            const { initPlanReportPage } = await import('/js/pages/plan-report.js');
            await initPlanReportPage();
            return;
        }
        // 🔥 CONTACT
        if (path.includes('address')) {
            console.log('📬 Loading contact page...');
            const { initContactPage } = await import('/js/pages/contact.js');
            await initContactPage();
            return;
        }

        console.log('❓ No matching page found');

    } catch (error) {
        console.error('❌ Page initialization failed:', error);
    }
}


// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

