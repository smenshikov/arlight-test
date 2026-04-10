// Shared Worker setup
let sharedWorker;
let workerPort;
let heartbeatInterval;

// Common utilities
const utils = {
    // Get DOM element safely
    getElement(selector) {
        return document.querySelector(selector);
    },
    
    // Get all DOM elements
    getElements(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Create element with classes and content
    createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    },
    
    // Animate element with CSS transitions
    animateElement(element, properties, duration = 300) {
        element.style.transition = `all ${duration}ms ease`;
        Object.assign(element.style, properties);
    }
};

// Animation utilities
const animations = {
    // Show notification with consistent styling
    showNotification(message, title = '', type = 'info') {
        const notification = utils.createElement('div', 'notification');
        
        // Add modifier for success type
        if (type === 'success') {
            notification.classList.add('notification--success');
        }
        
        if (title) {
            notification.innerHTML = `
                <div class="notification__title">${title}</div>
                <div class="notification__message">${message}</div>
            `;
        } else {
            notification.innerHTML = `<div class="notification__message">${message}</div>`;
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after delay
        setTimeout(() => {
            notification.style.animation = 'fadeOutUp 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, type === 'success' ? 3000 : 2000);
    },
    
    // Animate element appearance
    animateIn(element, properties = {}) {
        const defaults = {
            opacity: '0',
            transform: 'translateY(-10px)'
        };
        
        Object.assign(element.style, defaults, properties);
        
        // Trigger reflow
        element.offsetHeight;
        
        utils.animateElement(element, {
            opacity: '1',
            transform: 'translateY(0)'
        });
    }
};

// Theme utilities
const themeUtils = {
    // Get theme elements
    getElements() {
        return {
            page: utils.getElement('.page'),
            icon: utils.getElement('.theme-toggle__icon'),
            toggle: utils.getElement('#themeToggle')
        };
    },
    
    // Update theme UI
    updateUI(theme) {
        const { page, icon } = this.getElements();
        
        if (theme === 'dark') {
            page.classList.add('theme-dark');
            icon.textContent = ' Солнце';
        } else {
            page.classList.remove('theme-dark');
            icon.textContent = ' Луна';
        }
    },
    
    // Toggle theme
    toggle() {
        const { page } = this.getElements();
        const isDark = page.classList.toggle('theme-dark');
        const newTheme = isDark ? 'dark' : 'light';
        this.updateUI(newTheme);
        return newTheme;
    }
};

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
    const tabsCounterElement = utils.getElement('#tabsCounter');
    if (tabsCounterElement) {
        tabsCounterElement.textContent = count;
    }
}

// Update theme
function updateTheme(theme) {
    themeUtils.updateUI(theme);
    localStorage.setItem('theme', theme);
}

// Fallback theme initialization for browsers without Shared Worker support
function initThemeFallback() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    updateTheme(savedTheme);
    
    const { toggle } = themeUtils.getElements();
    toggle.addEventListener('click', () => {
        const newTheme = themeUtils.toggle();
        localStorage.setItem('theme', newTheme);
    });
}

// Theme toggle event with Shared Worker
const { toggle } = themeUtils.getElements();
toggle.addEventListener('click', () => {
    const newTheme = themeUtils.toggle();
    
    // Send theme change to Shared Worker
    if (workerPort) {
        workerPort.postMessage({
            type: 'theme',
            theme: newTheme
        });
    } else {
        localStorage.setItem('theme', newTheme);
    }
});

// Tabs counter functionality is now handled by Shared Worker
// The counter will be automatically updated when the worker connects

// Subscription form functionality
const subscriptionForm = utils.getElement('#subscriptionForm');
const emailInput = utils.getElement('#emailInput');
const errorMessage = utils.getElement('#errorMessage');
const subscribersList = utils.getElement('#subscribersList');

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
    const listItem = utils.createElement('li', 'subscription__subscriber-item', email);
    subscribersList.appendChild(listItem);
    
    // Animate in
    setTimeout(() => {
        animations.animateIn(listItem);
    }, 10);
}

// Show error message with smooth animation
function showError(message) {
    errorMessage.textContent = message;
    animations.animateIn(errorMessage, {
        transform: 'translateY(-5px)'
    });
}

// Hide error message with smooth animation
function hideError() {
    if (errorMessage.textContent) {
        utils.animateElement(errorMessage, {
            opacity: '0',
            transform: 'translateY(-5px)'
        });
        
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
    animations.showNotification('Успешная подписка!', '', 'success');
}


// Card button interactions
const cardButtons = utils.getElements('.card__button');
const cardData = [
    { title: 'Веб-разработка', message: 'Изучение ресурсов по веб-разработке...' },
    { title: 'UI/UX Дизайн', message: 'Открытие принципов UI/UX дизайна...' },
    { title: 'Frontend фреймворки', message: 'Изучение frontend фреймворков...' },
    { title: 'Производительность', message: 'Оптимизация веб-производительности...' }
];

cardButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        const { title, message } = cardData[index];
        animations.showNotification(message, title);
    });
});


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
