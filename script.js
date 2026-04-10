let sharedWorker;
let workerPort;
let heartbeatInterval;

const THEME = {
  LIGHT: {
    icon: '🌙',
  },
  DARK: {
    icon: '☀️',
  },
};

const NOTIFICATION_DURATION = {
  info: 2000,
  success: 3000,
};

const utils = {
  getElement(selector) {
    return document.querySelector(selector);
  },

  getElements(selector) {
    return document.querySelectorAll(selector);
  },

  createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.textContent = content;
    return element;
  },

  animateElement(element, properties, duration = 300) {
    element.style.transition = `all ${duration}ms ease`;
    Object.assign(element.style, properties);
  },
};

const animations = {
  showNotification(message, title = '', type) {
    const duration = NOTIFICATION_DURATION[type];

    const notification = utils.createElement('div', 'notification');

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
    }, duration);
  },

  animateIn(element, properties = {}) {
    const defaults = {
      opacity: '0',
      transform: 'translateY(-10px)',
    };

    Object.assign(element.style, defaults, properties);

    // Trigger reflow
    element.offsetHeight;

    utils.animateElement(element, {
      opacity: '1',
      transform: 'translateY(0)',
    });
  },
};

const themeUtils = {
  // Get theme elements
  getElements() {
    return {
      page: utils.getElement('.page'),
      icon: utils.getElement('.theme-toggle__icon'),
      toggle: utils.getElement('#themeToggle'),
    };
  },

  updateUI(theme) {
    const { page, icon } = this.getElements();

    if (theme === 'dark') {
      page.classList.add('theme-dark');
      icon.textContent = THEME.DARK.icon;
    } else {
      page.classList.remove('theme-dark');
      icon.textContent = THEME.LIGHT.icon;
    }
  },

  toggle() {
    const { page } = this.getElements();
    const isDark = page.classList.toggle('theme-dark');
    const newTheme = isDark ? 'dark' : 'light';
    this.updateUI(newTheme);
    return newTheme;
  },
};

function initSharedWorker(theme) {
  try {
    sharedWorker = new SharedWorker('./shared-worker.js');
    workerPort = sharedWorker.port;

    workerPort.addEventListener('message', handleWorkerMessage);
    workerPort.start();

    // Initialize Shared Worker with current theme
    workerPort.postMessage({ type: 'initTheme', theme });

    // Request current data
    workerPort.postMessage({ type: 'getTabCount' });
    workerPort.postMessage({ type: 'getTheme' });

    // Start sending heartbeat every 3 seconds
    heartbeatInterval = setInterval(() => {
      if (workerPort) {
        workerPort.postMessage({ type: 'heartbeat' });
      }
    }, 3000);
  } catch (error) {
    console.error('Shared Worker not supported:', error);
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

function updateTabsCounter(count) {
  const tabsCounterElement = utils.getElement('#tabsCounter');
  if (tabsCounterElement) {
    tabsCounterElement.textContent = count;
  }
}

function updateTheme(theme) {
  themeUtils.updateUI(theme);
  localStorage.setItem('theme', theme);
}

const { toggle } = themeUtils.getElements();
toggle.addEventListener('click', () => {
  const newTheme = themeUtils.toggle();

  localStorage.setItem('theme', newTheme);

  // Send theme change to Shared Worker
  if (workerPort) {
    workerPort.postMessage({
      type: 'theme',
      theme: newTheme,
    });
  }
});

const subscriptionForm = utils.getElement('#subscriptionForm');
const emailInput = utils.getElement('#emailInput');
const errorMessage = utils.getElement('#errorMessage');
const subscribersList = utils.getElement('#subscribersList');

function validateEmail(email) {
  const trimmedEmail = email.trim();

  // Regular expression for email validation with Latin characters only
  // Allows: letters (a-z, A-Z), numbers, dots, underscores, hyphens, @, and dots in domain
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  // todo: вернуться как будто лишнее
  const atIndex = trimmedEmail.indexOf('@');
  if (atIndex === -1 || atIndex === 0) return false;

  const domainPart = trimmedEmail.substring(atIndex + 1);
  const dotIndex = domainPart.indexOf('.');

  return dotIndex > 0 && dotIndex < domainPart.length - 1;
}

subscriptionForm.addEventListener('submit', e => {
  e.preventDefault();

  const email = emailInput.value.trim();

  if (!email) {
    showError('Пожалуйста, введите адрес электронной почты');
    return;
  }

  if (!validateEmail(email)) {
    showError(
      'Пожалуйста, введите корректный адрес электронной почты (только латинские символы, должен содержать @ и точку после него)'
    );
    return;
  }

  // Check if email already exists (case insensitive)
  const existingSubscribers = Array.from(subscribersList.children).map(item => item.textContent.trim().toLowerCase());

  if (existingSubscribers.includes(email.toLowerCase())) {
    showError('Этот адрес электронной почты уже подписан');
    return;
  }

  addSubscriber(email);

  emailInput.value = '';

  showSuccessMessage();
});

function addSubscriber(email) {
  const listItem = utils.createElement('li', 'subscription__subscriber-item', email);
  subscribersList.appendChild(listItem);

  animations.animateIn(listItem);
}

function showError(message) {
  errorMessage.textContent = message;
  animations.animateIn(errorMessage, {
    transform: 'translateY(-5px)',
  });
}

function hideError() {
  if (errorMessage.textContent) {
    utils.animateElement(errorMessage, {
      opacity: '0',
      transform: 'translateY(-5px)',
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
//todo: вынести текст отдельно чтобы потом масштабировать под перевод
function showSuccessMessage() {
  animations.showNotification('Успешная подписка!', '', 'success');
}

const cardButtons = utils.getElements('.card__button');
const cardData = [
  {
    title: 'Веб-разработка',
    message: 'Изучение ресурсов по веб-разработке...',
  },
  { title: 'UI/UX Дизайн', message: 'Открытие принципов UI/UX дизайна...' },
  { title: 'Frontend фреймворки', message: 'Изучение frontend фреймворков...' },
  {
    title: 'Производительность',
    message: 'Оптимизация веб-производительности...',
  },
];

cardButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    const { title, message } = cardData[index];
    animations.showNotification(message, title, 'info');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  themeUtils.updateUI(savedTheme);

  initSharedWorker(savedTheme);
});

window.addEventListener('beforeunload', () => {
  // Clear heartbeat interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Notify Shared Worker that tab is closing
  if (workerPort) {
    workerPort.postMessage({ type: 'disconnect' });
    workerPort.close();
  }
});
