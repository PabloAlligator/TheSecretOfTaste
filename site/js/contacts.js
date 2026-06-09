const header = document.querySelector('.header');
const burgerButton = document.querySelector('.header__burger');
const closeButton = document.querySelector('.header__close');
const overlay = document.querySelector('.header__overlay');
const mobileLinks = document.querySelectorAll('.header__mobile-link');
const cartCounter = document.querySelector('.header__cart-count');

let lastScrollTop = 0;

function openMobileMenu() {
  if (!header) return;

  header.classList.add('header--menu-open');
  document.body.classList.add('lock');
}

function closeMobileMenu() {
  if (!header) return;

  header.classList.remove('header--menu-open');
  document.body.classList.remove('lock');
}

if (burgerButton) burgerButton.addEventListener('click', openMobileMenu);
if (closeButton) closeButton.addEventListener('click', closeMobileMenu);
if (overlay) overlay.addEventListener('click', closeMobileMenu);

mobileLinks.forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

window.addEventListener('scroll', () => {
  if (!header || header.classList.contains('header--menu-open')) return;

  const currentScrollTop =
    window.pageYOffset || document.documentElement.scrollTop;

  if (currentScrollTop > lastScrollTop && currentScrollTop > 120) {
    header.classList.add('header--hidden');
  } else {
    header.classList.remove('header--hidden');
  }

  lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
});

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch (error) {
    localStorage.removeItem('cart');
    return [];
  }
}

function updateCartCounter() {
  if (!cartCounter) return;

  const cart = getCart();

  const totalCount = cart.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  cartCounter.textContent = totalCount;
}

function showToast(title, text, type = 'success') {
  const toast = document.querySelector('#toast');

  if (!toast) return;

  toast.classList.remove('toast--success', 'toast--error');
  toast.classList.add(`toast--${type}`);

  const icon = toast.querySelector('.toast__icon');
  const titleElement = toast.querySelector('strong');
  const textElement = toast.querySelector('span');

  if (icon) icon.textContent = type === 'success' ? '✓' : '!';
  if (titleElement) titleElement.textContent = title;
  if (textElement) textElement.textContent = text;

  toast.classList.add('active');

  clearTimeout(toast.hideTimeout);

  toast.hideTimeout = setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
}

function setQuickFormStartedAt() {
  const startedAtInput = document.querySelector('#quickFormStartedAt');

  if (startedAtInput) {
    startedAtInput.value = String(Date.now());
  }
}

function openQuickOrder() {
  const modal = document.querySelector('#quickOrderModal');
  const productBox = document.querySelector('#quickOrderProduct');
  const productIdInput = document.querySelector('#quickProductId');

  if (!modal) return;

  if (productIdInput) {
    productIdInput.value = '';
  }

  if (productBox) {
    productBox.innerHTML = `
      <div>
        <strong>Быстрый заказ</strong>
        <span>Мы поможем подобрать букет</span>
      </div>
    `;
  }

  setQuickFormStartedAt();

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeQuickOrder() {
  const modal = document.querySelector('#quickOrderModal');

  if (!modal) return;

  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

document.addEventListener('click', async (event) => {
  const quickTriggerButton = event.target.closest('.quick-order-trigger');
  const closeQuickButton = event.target.closest('[data-quick-close]');

  if (closeQuickButton) {
    closeQuickOrder();
    return;
  }

  if (quickTriggerButton) {
    openQuickOrder();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeQuickOrder();
  }
});

document
  .querySelector('#quickOrderForm')
  ?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const orderData = Object.fromEntries(formData);

    try {
      submitButton.disabled = true;
      submitButton.textContent = 'Отправляем...';

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка отправки заявки');
      }

      closeQuickOrder();
      form.reset();

      showToast(
        'Заявка отправлена',
        'Мы скоро свяжемся с вами для подтверждения заказа',
        'success',
      );
    } catch (error) {
      console.error('Contacts order error:', error);

      showToast(
        'Заявка не отправлена',
        error.message || 'Попробуйте ещё раз позже',
        'error',
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Отправить заявку';
    }
  });

updateCartCounter();
