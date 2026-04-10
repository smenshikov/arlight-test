// Theme toggle functionality
const themeToggle = document.getElementById('themeToggle');
const page = document.querySelector('.page');
const themeIcon = document.querySelector('.theme-toggle__icon');

// Load saved theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    page.classList.add('theme-dark');
    themeIcon.textContent = ' Солнце';
}

// Theme toggle event
themeToggle.addEventListener('click', () => {
    const isDark = page.classList.toggle('theme-dark');
    themeIcon.textContent = isDark ? ' Солнце' : ' Луна';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Tabs counter functionality
let tabsCounter = 0;
const tabsCounterElement = document.getElementById('tabsCounter');

// Simulate tab opening (for demonstration)
function incrementTabsCounter() {
    tabsCounter++;
    tabsCounterElement.textContent = tabsCounter;
}

// Initialize with some tabs
incrementTabsCounter();
incrementTabsCounter();

// Subscription form functionality
const subscriptionForm = document.getElementById('subscriptionForm');
const emailInput = document.getElementById('emailInput');
const errorMessage = document.getElementById('errorMessage');
const subscribersList = document.getElementById('subscribersList');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Form submission handler
subscriptionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    // Validate email
    if (!email) {
        errorMessage.textContent = 'Please enter your email address';
        return;
    }
    
    if (!emailRegex.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address';
        return;
    }
    
    // Check if email already exists
    const existingSubscribers = Array.from(subscribersList.children).map(
        item => item.textContent.trim()
    );
    
    if (existingSubscribers.includes(email)) {
        errorMessage.textContent = 'This email is already subscribed';
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
    console.log('Current theme:', savedTheme);
    console.log('Grid layout:', getComputedStyle(document.querySelector('.cards__grid')).gridTemplateColumns);
});
