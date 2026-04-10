// Shared Worker setup
let sharedWorker;
let workerPort;
let heartbeatInterval;

// Initialize Shared Worker
function initSharedWorker() {
    try {
        sharedWorker = new SharedWorker('./shared-worker.js');
        workerPort = sharedWorker.port;
        
        workerPort.addEventListener('message', handleWorkerMessage);
        workerPort.start();
        
        // Start heartbeat to keep connection alive
        heartbeatInterval = setInterval(() => {
            if (workerPort) {
                workerPort.postMessage({ type: 'heartbeat' });
            }
        }, 3000);
        
        // Request current data
        workerPort.postMessage({ type: 'getTabCount' });
        workerPort.postMessage({ type: 'getTheme' });
    } catch (error) {
        console.error('Shared Worker not supported:', error);
        // Fallback to localStorage for theme
        initThemeFallback();
    }
}

// Handle messages from Shared Worker
function handleWorkerMessage(event) {
    const message = event.data;
    
    switch (message.type) {
        case 'tabCount':
            updateTabsCounter(message.count);
            break;
        case 'theme':
            updateTheme(message.theme);
            break;
    }
}

// Update tabs counter display
function updateTabsCounter(count) {
    const tabsCounterElement = document.getElementById('tabsCounter');
    if (tabsCounterElement) {
        tabsCounterElement.textContent = count;
    }
}

// Update theme
function updateTheme(theme) {
    const page = document.querySelector('.page');
    const themeIcon = document.querySelector('.theme-toggle__icon');
    
    if (theme === 'dark') {
        page.classList.add('theme-dark');
        themeIcon.textContent = ' Солнце';
    } else {
        page.classList.remove('theme-dark');
        themeIcon.textContent = ' Луна';
    }
    
    // Also save to localStorage as backup
    localStorage.setItem('theme', theme);
}

// Fallback theme initialization for browsers without Shared Worker support
function initThemeFallback() {
    const themeToggle = document.getElementById('themeToggle');
    const page = document.querySelector('.page');
    const themeIcon = document.querySelector('.theme-toggle__icon');
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    updateTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const isDark = page.classList.toggle('theme-dark');
        const newTheme = isDark ? 'dark' : 'light';
        themeIcon.textContent = isDark ? ' Солнце' : ' Луна';
        localStorage.setItem('theme', newTheme);
    });
}

// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const page = document.querySelector('.page');
const themeIcon = document.querySelector('.theme-toggle__icon');

// Theme toggle event with Shared Worker
themeToggle.addEventListener('click', () => {
    const isDark = page.classList.toggle('theme-dark');
    const newTheme = isDark ? 'dark' : 'light';
    themeIcon.textContent = isDark ? ' Солнце' : ' Луна';
    
    // Send theme change to Shared Worker
    if (workerPort) {
        workerPort.postMessage({
            type: 'theme',
            theme: newTheme
        });
    } else {
        // Fallback to localStorage
        localStorage.setItem('theme', newTheme);
    }
});

// Tabs counter functionality is now handled by Shared Worker
// The counter will be automatically updated when the worker connects

// Subscription form functionality
const subscriptionForm = document.getElementById('subscriptionForm');
const emailInput = document.getElementById('emailInput');
const errorMessage = document.getElementById('errorMessage');
const subscribersList = document.getElementById('subscribersList');

// Email validation function - checks for @ and dot after @
function validateEmail(email) {
    const trimmedEmail = email.trim();
    
    // Check if email contains @ and at least one dot after @
    const atIndex = trimmedEmail.indexOf('@');
    if (atIndex === -1 || atIndex === 0) return false;
    
    const domainPart = trimmedEmail.substring(atIndex + 1);
    const dotIndex = domainPart.indexOf('.');
    
    // Check if there's at least one dot after @ and it's not at the beginning
    return dotIndex > 0 && dotIndex < domainPart.length - 1;
}

// Form submission handler
subscriptionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    // Validate email
    if (!email) {
        showError('Пожалуйста, введите адрес электронной почты');
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Пожалуйста, введите корректный адрес электронной почты (должен содержать @ и точку после него)');
        return;
    }
    
    // Check if email already exists (case insensitive)
    const existingSubscribers = Array.from(subscribersList.children).map(
        item => item.textContent.trim().toLowerCase()
    );
    
    if (existingSubscribers.includes(email.toLowerCase())) {
        showError('Этот адрес электронной почты уже подписан');
        return;
    }
    
    // Add new subscriber
    addSubscriber(email);
    
    // Clear form
    emailInput.value = '';
    
    // Show success message
    showSuccessMessage();
});

// Add subscriber to list
function addSubscriber(email) {
    const listItem = document.createElement('li');
    listItem.className = 'subscription__subscriber-item';
    listItem.textContent = email;
    
    // Add animation
    listItem.style.opacity = '0';
    listItem.style.transform = 'translateY(-10px)';
    
    subscribersList.appendChild(listItem);
    
    // Animate in
    setTimeout(() => {
        listItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        listItem.style.opacity = '1';
        listItem.style.transform = 'translateY(0)';
    }, 10);
}

// Show error message with smooth animation
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.opacity = '0';
    errorMessage.style.transform = 'translateY(-5px)';
    
    // Trigger reflow
    errorMessage.offsetHeight;
    
    errorMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    errorMessage.style.opacity = '1';
    errorMessage.style.transform = 'translateY(0)';
}

// Hide error message with smooth animation
function hideError() {
    if (errorMessage.textContent) {
        errorMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        errorMessage.style.opacity = '0';
        errorMessage.style.transform = 'translateY(-5px)';
        
        setTimeout(() => {
            errorMessage.textContent = '';
            errorMessage.style.transform = 'translateY(0)';
        }, 300);
    }
}

// Input event handler - clear error when user starts typing
emailInput.addEventListener('input', () => {
    if (errorMessage.textContent) {
        hideError();
    }
});

// Show success message
function showSuccessMessage() {
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    successMessage.textContent = 'Успешная подписка!';
    
    document.body.appendChild(successMessage);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successMessage.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 300);
    }, 3000);
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Card button interactions
const cardButtons = document.querySelectorAll('.card__button');

cardButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        const cardTitles = ['Веб-разработка', 'UI/UX Дизайн', 'Frontend фреймворки', 'Производительность'];
        const messages = [
            'Изучение ресурсов по веб-разработке...',
            'Открытие принципов UI/UX дизайна...',
            'Изучение frontend фреймворков...',
            'Оптимизация веб-производительности...'
        ];
        
        showNotification(messages[index], cardTitles[index]);
    });
});

// Show notification for card buttons
function showNotification(message, title) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--button-bg);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1001;
        max-width: 400px;
        text-align: center;
        animation: fadeInDown 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px;">${title}</div>
        <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOutUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Add fade animations
const fadeStyle = document.createElement('style');
fadeStyle.textContent = `
    @keyframes fadeInDown {
        from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOutUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(fadeStyle);

// Handle window resize for responsive behavior
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Add any resize-specific logic here
        console.log('Window resized - responsive layout active');
    }, 250);
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded successfully');
    
    // Initialize Shared Worker
    initSharedWorker();
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    console.log('Current theme:', savedTheme);
    console.log('Grid layout:', getComputedStyle(document.querySelector('.cards__grid')).gridTemplateColumns);
});

// Handle page unload to notify Shared Worker
window.addEventListener('beforeunload', () => {
    // Clear heartbeat
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    if (workerPort) {
        workerPort.close();
    }
});
