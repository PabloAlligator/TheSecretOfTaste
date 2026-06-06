const header = document.querySelector('.header');
const burgerButton = document.querySelector('.header__burger');
const closeButton = document.querySelector('.header__close');
const overlay = document.querySelector('.header__overlay');
const mobileLinks = document.querySelectorAll('.header__mobile-link');
const cartCounter = document.querySelector('.header__cart-count');

const cartItemsContainer = document.querySelector('#cartItems');
const cartEmpty = document.querySelector('#cartEmpty');
const cartItemsCount = document.querySelector('#cartItemsCount');
const summaryItemsCount = document.querySelector('#summaryItemsCount');
const cartSubtotal = document.querySelector('#cartSubtotal');
const cartTotal = document.querySelector('#cartTotal');
const checkoutButton = document.querySelector('#cartCheckoutButton');

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

function normalizeCartItem(item) {
  const productId = Number(item.productId || item.id);
  const quantity = Math.max(Number(item.quantity) || 1, 1);

  if (!productId) return null;

  return {
    productId,
    quantity,
  };
}

function getNormalizedCart() {
  return getCart().map(normalizeCartItem).filter(Boolean);
}

function updateCartCounter() {
  if (!cartCounter) return;

  const cart = getNormalizedCart();

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

function formatPrice(price) {
  return `${Number(price || 0).toLocaleString('ru-RU')} ₽`;
}

function escapeHTML(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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

function getCartProducts(cart, products) {
  const productsMap = new Map();

  products.forEach((product) => {
    productsMap.set(Number(product.id), product);
  });

  return cart
    .map((cartItem) => {
      const product = productsMap.get(Number(cartItem.productId));

      if (!product) return null;

      return {
        ...product,
        quantity: cartItem.quantity,
      };
    })
    .filter(Boolean);
}

function syncCartWithProducts(cartProducts) {
  const cleanedCart = cartProducts.map((product) => {
    return {
      productId: Number(product.id),
      quantity: Number(product.quantity),
    };
  });

  saveCart(cleanedCart);
  updateCartCounter();
}

function updateSummary(cartProducts) {
  const totalQuantity = cartProducts.reduce((sum, product) => {
    return sum + Number(product.quantity || 0);
  }, 0);

  const totalPrice = cartProducts.reduce((sum, product) => {
    return sum + Number(product.price || 0) * Number(product.quantity || 0);
  }, 0);

  if (cartItemsCount) cartItemsCount.textContent = totalQuantity;
  if (summaryItemsCount) summaryItemsCount.textContent = `(${totalQuantity})`;
  if (cartSubtotal) cartSubtotal.textContent = formatPrice(totalPrice);
  if (cartTotal) cartTotal.textContent = formatPrice(totalPrice);
}

function createCartItem(product) {
  const title = escapeHTML(product.title);
  const description = escapeHTML(product.shortDescription || '');
  const image = product.image || '/site/img/products/product-placeholder.jpg';
  const price = Number(product.price || 0);
  const quantity = Number(product.quantity || 1);
  const itemTotal = price * quantity;
  const berriesText = product.berriesCount
    ? `${product.berriesCount} ягод в букете`
    : '';

  return `
    <article class="cart-item">
     <a class="cart-item__image" href="/product/${encodeURIComponent(product.slug)}">
        <img src="${image}" alt="${title}" />
      </a>

      <div class="cart-item__content">
        <div class="cart-item__info">
          <h3>${title}</h3>
          <p>${description}</p>

${berriesText ? `<span class="cart-item__meta">${berriesText}</span>` : ''}
        </div>

        <strong class="cart-item__price">
          ${formatPrice(price)}
        </strong>

        <div class="cart-item__quantity">
          <button
            class="cart-item__quantity-button"
            type="button"
            data-action="decrease"
            data-product-id="${product.id}"
            aria-label="Уменьшить количество"
          >
            −
          </button>

          <span>${quantity}</span>

          <button
            class="cart-item__quantity-button"
            type="button"
            data-action="increase"
            data-product-id="${product.id}"
            aria-label="Увеличить количество"
          >
            +
          </button>
        </div>

        <strong class="cart-item__total">
          ${formatPrice(itemTotal)}
        </strong>

        <button
          class="cart-item__remove"
          type="button"
          data-action="remove"
          data-product-id="${product.id}"
          aria-label="Удалить букет"
        >
          ×
        </button>
      </div>
    </article>
  `;
}

async function renderCartPage() {
  if (!cartItemsContainer) return;

  try {
    const cart = getNormalizedCart();
    const products = await getProducts();
    const cartProducts = getCartProducts(cart, products);

    if (cart.length !== cartProducts.length) {
      syncCartWithProducts(cartProducts);
    }

    if (!cartProducts.length) {
      cartItemsContainer.innerHTML = '';

      if (cartEmpty) cartEmpty.hidden = false;
      if (checkoutButton) checkoutButton.disabled = true;

      updateSummary([]);
      updateCartCounter();

      return;
    }

    if (cartEmpty) cartEmpty.hidden = true;
    if (checkoutButton) checkoutButton.disabled = false;

    cartItemsContainer.innerHTML = cartProducts.map(createCartItem).join('');

    updateSummary(cartProducts);
    updateCartCounter();
  } catch (error) {
    console.error('Cart render error:', error);

    cartItemsContainer.innerHTML = `
      <div class="cart-page__empty">
        <h3>Не удалось загрузить корзину</h3>
        <p>Обновите страницу или попробуйте позже.</p>
      </div>
    `;
  }
}

function setQuickFormStartedAt() {
  const startedAtInput = document.querySelector('#quickFormStartedAt');

  if (startedAtInput) {
    startedAtInput.value = String(Date.now());
  }
}

async function openCheckoutModal() {
  const cart = getNormalizedCart();

  if (!cart.length) {
    showToast('Корзина пуста', 'Добавьте букет перед оформлением', 'error');
    return;
  }

  const products = await getProducts();
  const cartProducts = getCartProducts(cart, products);

  const modal = document.querySelector('#quickOrderModal');
  const productBox = document.querySelector('#quickOrderProduct');

  if (!modal) return;

  const totalPrice = cartProducts.reduce((sum, product) => {
    return sum + Number(product.price || 0) * Number(product.quantity || 0);
  }, 0);

  if (productBox) {
    productBox.innerHTML = `
      <div>
        <strong>Заказ из корзины</strong>
        <span>${cartProducts.length} поз. · ${formatPrice(totalPrice)}</span>
      </div>
    `;
  }

  setQuickFormStartedAt();

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

async function openQuickOrder() {
  const modal = document.querySelector('#quickOrderModal');
  const productBox = document.querySelector('#quickOrderProduct');

  if (!modal) return;

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
  const actionButton = event.target.closest('[data-action]');
  const checkoutButtonElement = event.target.closest('#cartCheckoutButton');
  const quickTriggerButton = event.target.closest('.quick-order-trigger');
  const closeQuickButton = event.target.closest('[data-quick-close]');

  if (closeQuickButton) {
    closeQuickOrder();
    return;
  }

  if (checkoutButtonElement) {
    await openCheckoutModal();
    return;
  }

  if (quickTriggerButton) {
    await openQuickOrder();
    return;
  }

  if (!actionButton) return;

  const action = actionButton.dataset.action;
  const productId = Number(actionButton.dataset.productId);

  if (!productId) return;

  let cart = getNormalizedCart();

  const cartItem = cart.find((item) => {
    return Number(item.productId) === productId;
  });

  if (!cartItem) return;

  if (action === 'increase') {
    cartItem.quantity += 1;
  }

  if (action === 'decrease') {
    cartItem.quantity -= 1;

    if (cartItem.quantity <= 0) {
      cart = cart.filter((item) => Number(item.productId) !== productId);
    }
  }

  if (action === 'remove') {
    cart = cart.filter((item) => Number(item.productId) !== productId);
  }

  saveCart(cart);
  updateCartCounter();
  renderCartPage();
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

    const cart = getNormalizedCart();

    if (!cart.length) {
      showToast('Корзина пуста', 'Добавьте букет перед оформлением', 'error');
      return;
    }

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const orderData = Object.fromEntries(formData);

    orderData.type = 'cart';
    orderData.items = cart.map((item) => {
      return {
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      };
    });

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

      saveCart([]);
      updateCartCounter();
      await renderCartPage();

      closeQuickOrder();
      form.reset();

      showToast(
        'Заявка отправлена',
        'Мы скоро свяжемся с вами для подтверждения заказа',
        'success',
      );
    } catch (error) {
      console.error('Cart order error:', error);

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
renderCartPage();
