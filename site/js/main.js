const header = document.querySelector('.header');
const burgerButton = document.querySelector('.header__burger');
const closeButton = document.querySelector('.header__close');
const overlay = document.querySelector('.header__overlay');
const mobileLinks = document.querySelectorAll('.header__mobile-link');
const cartCounter = document.querySelector('.header__cart-count');
const popularProductsContainer = document.querySelector('#popularProducts');

let lastScrollTop = 0;
let allProducts = [];

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

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCounter() {
  if (!cartCounter) return;

  const cart = getCart();

  const totalCount = cart.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  cartCounter.textContent = totalCount;
}

function addToCart(productId) {
  const cart = getCart();

  const existingItem = cart.find((item) => {
    return Number(item.productId) === Number(productId);
  });

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      productId: Number(productId),
      quantity: 1,
    });
  }

  saveCart(cart);
  updateCartCounter();
}

function showToast(title, text, type = 'success') {
  const toast = document.querySelector('#toast');

  if (!toast) {
    console.warn('Toast #toast не найден');
    return;
  }

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

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString('ru-RU');
}

async function getProducts() {
  if (allProducts.length) return allProducts;

  const response = await fetch('/api/products');

  if (!response.ok) {
    throw new Error('Не удалось загрузить букеты');
  }

  allProducts = await response.json();

  return allProducts;
}

function getProductBadge(product) {
  if (product.isSale) {
    return '<span class="offers__badge">Акция</span>';
  }

  if (product.isHit) {
    return '<span class="offers__badge">Хит</span>';
  }

  return '';
}

function createProductCard(product) {
  const title = escapeHTML(product.title);
  const description = escapeHTML(product.shortDescription);
  const image = product.image || '/site/img/products/product-placeholder.jpg';
  const price = formatPrice(product.price);
  const berriesText = product.berriesCount
    ? `${product.berriesCount} ягод в букете`
    : '';

  return `
    <article class="offers__card">
      <a class="offers__image" href="/product/${encodeURIComponent(product.slug)}">
        <img src="${image}" alt="${title}" />
        ${getProductBadge(product)}
      </a>

      <div class="offers__content">
        <h3 class="offers__name">${title}</h3>

        <p class="offers__description">${description}</p>
        ${berriesText ? `<p class="offers__meta">${berriesText}</p>` : ''}

        <div class="offers__bottom">
          <div class="offers__price">
            <span>от</span>
            ${price} ₽
          </div>

          <div class="offers__actions">
            <button
              class="offers__button offers__button--cart"
              type="button"
              data-product-id="${product.id}"
            >
              В корзину
            </button>

            <button
              class="offers__button offers__button--quick"
              type="button"
              data-product-id="${product.id}"
            >
              Быстрый заказ
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function loadPopularProducts() {
  if (!popularProductsContainer) return;

  try {
    const response = await fetch('/api/products?home=true&limit=4');

    if (!response.ok) {
      throw new Error('Ошибка загрузки букетов');
    }

    const products = await response.json();

    if (!products.length) {
      popularProductsContainer.innerHTML = `
        <p class="offers__empty">
          Букеты скоро появятся в каталоге.
        </p>
      `;
      return;
    }

    popularProductsContainer.innerHTML = products
      .map(createProductCard)
      .join('');
  } catch (error) {
    console.error('Popular products error:', error);

    popularProductsContainer.innerHTML = `
      <p class="offers__empty">
        Сейчас букеты временно не загрузились. Попробуйте открыть каталог.
      </p>
    `;
  }
}

function setQuickFormStartedAt() {
  const startedAtInput = document.querySelector('#quickFormStartedAt');

  if (startedAtInput) {
    startedAtInput.value = String(Date.now());
  }
}

async function openQuickOrder(productId = null) {
  const modal = document.querySelector('#quickOrderModal');
  const productBox = document.querySelector('#quickOrderProduct');
  const productIdInput = document.querySelector('#quickProductId');

  if (!modal) {
    console.error('Модалка #quickOrderModal не найдена');
    return;
  }

  let product = null;

  if (productId) {
    const products = await getProducts();

    product = products.find((item) => {
      return Number(item.id) === Number(productId);
    });
  }

  if (product && productBox && productIdInput) {
    productIdInput.value = product.id;

    productBox.innerHTML = `
      <img src="${product.image || '/site/img/products/product-placeholder.jpg'}" alt="${escapeHTML(product.title)}" />

      <div>
        <strong>${escapeHTML(product.title)}</strong>
        <span>${formatPrice(product.price)} ₽</span>
      </div>
    `;
  }

  if (!product && productBox && productIdInput) {
    productIdInput.value = '';

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
  const cartButton = event.target.closest('.offers__button--cart');
  const quickProductButton = event.target.closest('.offers__button--quick');
  const quickTriggerButton = event.target.closest('.quick-order-trigger');
  const closeQuickButton = event.target.closest('[data-quick-close]');

  if (closeQuickButton) {
    closeQuickOrder();
    return;
  }

  if (cartButton) {
    const productId = Number(cartButton.dataset.productId);

    if (!productId) return;

    addToCart(productId);
    showToast('Букет добавлен', 'Букет успешно добавлен в корзину', 'success');
    return;
  }

  if (quickProductButton) {
    const productId = Number(quickProductButton.dataset.productId);

    if (!productId) return;

    await openQuickOrder(productId);
    return;
  }

  if (quickTriggerButton) {
    await openQuickOrder();
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
      console.error('Order submit error:', error);

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
loadPopularProducts();
