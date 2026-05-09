/**
 * Footer Component
 * Dynamically loads the footer HTML
 */

export async function loadFooter() {
    console.log('========== FOOTER LOAD DEBUG ==========');
    console.log('1. Current window location:', window.location.href);
    
    const possiblePaths = [
        '/components/footer.html',
        '/public/components/footer.html',
        'components/footer.html',
        './components/footer.html',
        '../components/footer.html',
        `${window.location.origin}/components/footer.html`,
        `${window.location.origin}/public/components/footer.html`
    ];
    
    console.log('2. Trying these paths:', possiblePaths);
    
    for (const path of possiblePaths) {
        try {
            console.log(`   Trying: ${path}`);
            const response = await fetch(path);
            
            if (response.ok) {
                const html = await response.text();
                console.log(`   ✅ SUCCESS! Found footer at: ${path}`);
                document.body.insertAdjacentHTML('beforeend', html);
                console.log('========== FOOTER LOAD COMPLETE ==========');
                return;
            } else {
                console.log(`   ❌ Failed (${response.status}): ${path}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${path} - ${error.message}`);
        }
    }
    
    console.error('❌ ALL PATHS FAILED - Could not load footer!');
    console.log('========== DEBUG END ==========');
    
    // Fallback footer
    createFallbackFooter();
}

function createFallbackFooter() {
    const fallbackFooter = `
        <footer class="site-footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-column">
                        <h3>Harari Regional State Labor and Social Affairs Office</h3>
                        <p>Ensuring social protection and labor rights for all citizens.</p>
                    </div>
                    <div class="footer-column">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><a href="index.html">Home</a></li>
                            <li><a href="pages/about.html">About</a></li>
                            <li><a href="pages/contact.html">Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div class="copyright">
                    <p>&copy; 2025 All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    `;
    document.body.insertAdjacentHTML('beforeend', fallbackFooter);
}