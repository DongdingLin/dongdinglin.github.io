// Theme switching functionality
const THEME_LANGUAGE_STORAGE_KEY = 'site_language';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
    
    // Add theme toggle button to navigation bar (if not exists)
    if (!document.getElementById('theme-toggle')) {
        const navBar = document.querySelector('.nav-bar ul');
        if (navBar) {
            const themeToggleLi = document.createElement('li');
            themeToggleLi.innerHTML = `
                <a href="#" id="theme-toggle">
                    <i class="fas fa-moon" id="theme-icon"></i> 
                    <span id="theme-text">Dark Mode</span>
                </a>
            `;
            navBar.appendChild(themeToggleLi);
            
            // Update icon and text
            updateThemeToggle(currentTheme, getSiteLanguage());
            
            // Add event listener
            document.getElementById('theme-toggle').addEventListener('click', function(e) {
                e.preventDefault();
                toggleTheme();
            });
        }
    }

    window.addEventListener('site-language-change', event => {
        const language = event?.detail?.lang || getSiteLanguage();
        const activeTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        updateThemeToggle(activeTheme, language);
    });
});

// Toggle theme
function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    setTheme(newTheme);
    updateThemeToggle(newTheme, getSiteLanguage());
    
    // Save to local storage
    localStorage.setItem('theme', newTheme);
}

// Set theme
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// Update toggle button icon and text
function updateThemeToggle(theme, language = 'en') {
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (!themeIcon || !themeText) {
        return;
    }

    const lang = language === 'zh' ? 'zh' : 'en';
    
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = lang === 'zh' ? '浅色模式' : 'Light Mode';
    } else {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = lang === 'zh' ? '深色模式' : 'Dark Mode';
    }
}

function getSiteLanguage() {
    const stored = localStorage.getItem(THEME_LANGUAGE_STORAGE_KEY);
    return stored === 'zh' ? 'zh' : 'en';
}
