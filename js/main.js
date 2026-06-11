// Syntax highlighting initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize highlight.js
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
    
    // Add line numbers to code blocks
    addLineNumbersToCodeBlocks();
    
    // Smooth scroll for table of contents
    initSmoothScroll();
    
    // Add copy button to code blocks
    addCopyButtons();
});

// Function to add line numbers to code blocks
function addLineNumbersToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach((block) => {
        // Check if line numbers already added
        if (block.querySelector('.line-number')) return;
        
        const lines = block.innerHTML.split('\n');
        
        // Only add line numbers if there's more than one line
        if (lines.length > 2) {
            let numberedLines = lines.map((line, index) => {
                if (line.trim() === '' && index === lines.length - 1) return '';
                return `<span class="line-number">${index + 1}</span>${line}`;
            }).join('\n');
            
            block.innerHTML = numberedLines;
        }
    });
}

// Function to add copy buttons to code blocks
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('.content pre');
    
    codeBlocks.forEach((block) => {
        // Check if copy button already exists
        if (block.querySelector('.copy-btn')) return;
        
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code to clipboard');
        
        button.addEventListener('click', async () => {
            const code = block.querySelector('code').innerText;
            try {
                await navigator.clipboard.writeText(code);
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                button.textContent = 'Failed!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            }
        });
        
        block.style.position = 'relative';
        block.appendChild(button);
    });
}

// Smooth scroll for table of contents links
function initSmoothScroll() {
    const tocLinks = document.querySelectorAll('.toc a');
    
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without scrolling
                history.pushState(null, null, targetId);
            }
        });
    });
}

// Function to highlight current section in TOC
function highlightCurrentSection() {
    const sections = document.querySelectorAll('.content h2, .content h3, .content h4');
    const tocLinks = document.querySelectorAll('.toc a');
    
    if (sections.length === 0 || tocLinks.length === 0) return;
    
    const scrollPosition = window.scrollY + 100;
    
    let currentSection = '';
    sections.forEach(section => {
        if (section.offsetTop <= scrollPosition) {
            currentSection = '#' + section.id;
        }
    });
    
    tocLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentSection) {
            link.classList.add('active');
        }
    });
}

// Throttle scroll event for better performance
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(highlightCurrentSection, 100);
});

// Initialize highlight on load
highlightCurrentSection();

// Function to handle language switching without page reload (optional)
function switchLanguage(lang) {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    
    // Remove empty first element
    pathParts.shift();
    
    // Replace language code
    if (pathParts.length > 0 && (pathParts[0] === 'en' || pathParts[0] === 'zh')) {
        pathParts[0] = lang;
    } else {
        pathParts.unshift(lang);
    }
    
    const newPath = '/' + pathParts.join('/');
    window.location.href = newPath;
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search (if implemented)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Implement search focus here
        console.log('Search shortcut triggered');
    }
});

// Responsive navigation for mobile
function initMobileNav() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    // Create hamburger button for mobile
    if (window.innerWidth <= 768) {
        let hamburger = document.querySelector('.hamburger');
        if (!hamburger) {
            hamburger = document.createElement('button');
            hamburger.className = 'hamburger';
            hamburger.innerHTML = '☰';
            hamburger.setAttribute('aria-label', 'Menu');
            
            const navContainer = document.querySelector('.nav-container');
            if (navContainer) {
                navContainer.insertBefore(hamburger, navMenu);
                
                hamburger.addEventListener('click', () => {
                    navMenu.classList.toggle('show');
                });
            }
        }
    }
}

// Call on load and resize
window.addEventListener('load', initMobileNav);
window.addEventListener('resize', initMobileNav);

// Add CSS for mobile navigation
const mobileNavStyles = `
@media (max-width: 768px) {
    .hamburger {
        display: block;
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
    }
    
    .nav-menu {
        display: none;
        width: 100%;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
    }
    
    .nav-menu.show {
        display: flex;
    }
    
    .copy-btn {
        top: 0.5rem;
        right: 0.5rem;
        font-size: 0.75rem;
        padding: 0.3rem 0.6rem;
    }
}

@media (min-width: 769px) {
    .hamburger {
        display: none;
    }
}
`;

// Add mobile navigation styles
const styleSheet = document.createElement("style");
styleSheet.textContent = mobileNavStyles;
document.head.appendChild(styleSheet);

// Copy button styles
const copyButtonStyles = `
.copy-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: #667eea;
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.3s ease;
    opacity: 0;
}

pre:hover .copy-btn {
    opacity: 1;
}

.copy-btn:hover {
    background: #764ba2;
    transform: translateY(-1px);
}

.toc a.active {
    color: #667eea;
    font-weight: bold;
}
`;

styleSheet.textContent += copyButtonStyles;
