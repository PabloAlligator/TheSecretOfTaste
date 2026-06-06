const express = require('express');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function normalizeString(value, maxLength = 120) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

function normalizePhone(value) {
  const rawPhone = normalizeString(value, 40);
  const digits = rawPhone.replace(/\D/g, '');

  if (
    digits.length === 11 &&
    (digits.startsWith('7') || digits.startsWith('8'))
  ) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  return null;
}

function isHoneypotFilled(body) {
  return Boolean(normalizeString(body.website, 200));
}

function isTooFast(body, minMs = 2000) {
  const startedAt = Number(body.formStartedAt);

  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return false;
  }

  return Date.now() - startedAt < minMs;
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} ₽`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (symbol) => {
    const symbols = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return symbols[symbol];
  });
}

function normalizeOrderItems(body) {
  if (Array.isArray(body.items) && body.items.length) {
    return body.items
      .map((item) => {
        const productId = Number(item.productId || item.id);
        const quantity = Math.max(Number(item.quantity) || 1, 1);

        if (!productId) return null;

        return {
          productId,
          quantity,
        };
      })
      .filter(Boolean);
  }

  const productId = Number(body.productId);

  if (!productId) {
    return [];
  }

  return [
    {
      productId,
      quantity: 1,
    },
  ];
}

async function buildOrderItems(body) {
  const requestedItems = normalizeOrderItems(body);

  if (!requestedItems.length) {
    return [];
  }

  const productIds = [...new Set(requestedItems.map((item) => item.productId))];

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      isActive: true,
    },
  });

  const productsMap = new Map();

  products.forEach((product) => {
    productsMap.set(product.id, product);
  });

  const orderItems = [];

  requestedItems.forEach((requestedItem) => {
    const product = productsMap.get(requestedItem.productId);

    if (!product) return;

    orderItems.push({
      productId: product.id,
      titleSnapshot: product.title,
      priceSnapshot: product.price,
      berriesCountSnapshot: product.berriesCount,
      quantity: requestedItem.quantity,
    });
  });

  return orderItems;
}

function formatOrderEmail(order) {
  const orderType = order.type === 'cart' ? 'Корзина' : 'Быстрый заказ';

  const itemsText = order.items.length
    ? order.items
        .map((item) => {
          const berriesText = item.berriesCountSnapshot
            ? `, ${item.berriesCountSnapshot} ягод`
            : '';

          return `— ${item.titleSnapshot}${berriesText}, ${item.quantity} шт., ${formatMoney(
            item.priceSnapshot * item.quantity,
          )}`;
        })
        .join('\n')
    : 'Клиент оставил общую заявку без выбора букета.';

  const itemsHtml = order.items.length
    ? order.items
        .map((item) => {
          return `
            <tr>
              <td style="padding:14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#fff;font-weight:700;">
                ${escapeHtml(item.titleSnapshot)}
${
  item.berriesCountSnapshot
    ? `<div style="margin-top:4px;color:#bda69c;font-size:12px;font-weight:500;">${item.berriesCountSnapshot} ягод в букете</div>`
    : ''
}
              </td>

              <td style="padding:14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#ead6cd;text-align:center;">
                ${item.quantity}
              </td>

              <td style="padding:14px;border-bottom:1px solid rgba(255,255,255,0.08);color:#fff;text-align:right;font-weight:800;">
                ${formatMoney(item.priceSnapshot * item.quantity)}
              </td>
            </tr>
          `;
        })
        .join('')
    : `
      <tr>
        <td colspan="3" style="padding:18px;border-bottom:1px solid rgba(255,255,255,0.08);color:#ead6cd;text-align:center;">
          Клиент оставил общую заявку без выбора букета.
        </td>
      </tr>
    `;

  const text = `
Новая заявка с сайта "Тайна вкуса"

Номер заявки: ${order.id}
Тип заявки: ${orderType}
Имя: ${order.customerName}
Телефон: ${order.phone}
Комментарий: ${order.comment || '—'}
Сумма: ${formatMoney(order.totalPrice)}
Дата: ${order.createdAt.toLocaleString('ru-RU')}

Букеты:
${itemsText}
  `.trim();

  const html = `
    <div style="margin:0;padding:0;background:#130907;font-family:Arial,Helvetica,sans-serif;color:#fff;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#130907;padding:32px 12px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:760px;border-collapse:collapse;">
              <tr>
                <td style="padding:0 0 18px 0;">
                  <div style="display:inline-block;padding:8px 13px;border:1px solid rgba(217,128,141,0.45);border-radius:999px;background:rgba(217,128,141,0.12);color:#fff;font-size:12px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;">
                    Тайна вкуса
                  </div>
                </td>
              </tr>

              <tr>
                <td style="overflow:hidden;border:1px solid rgba(217,128,141,0.35);border-radius:24px;background:#24130f;box-shadow:0 24px 70px rgba(0,0,0,0.45);">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:34px 32px;background:linear-gradient(135deg,#2d1812 0%,#130907 62%,rgba(217,128,141,0.24) 100%);border-bottom:1px solid rgba(255,255,255,0.08);">
                        <div style="color:#d9808d;font-size:13px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;">
                          Новая заявка
                        </div>

                        <h1 style="margin:10px 0 0 0;color:#fff;font-size:30px;line-height:1.1;font-weight:900;">
                          Заказ с сайта
                        </h1>

                        <p style="margin:12px 0 0 0;color:#ead6cd;font-size:15px;line-height:1.55;">
                          Клиент оставил заявку на букет из клубники в шоколаде.
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:26px 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                          <tr>
                            <td style="padding:10px 0;color:#bda69c;font-size:13px;">Номер заявки</td>
                            <td style="padding:10px 0;color:#fff;font-size:14px;font-weight:800;text-align:right;">${order.id}</td>
                          </tr>

                          <tr>
                            <td style="padding:10px 0;color:#bda69c;font-size:13px;">Тип заявки</td>
                            <td style="padding:10px 0;color:#fff;font-size:14px;font-weight:800;text-align:right;">${escapeHtml(orderType)}</td>
                          </tr>

                          <tr>
                            <td style="padding:10px 0;color:#bda69c;font-size:13px;">Имя</td>
                            <td style="padding:10px 0;color:#fff;font-size:16px;font-weight:900;text-align:right;">${escapeHtml(order.customerName)}</td>
                          </tr>

                          <tr>
                            <td style="padding:10px 0;color:#bda69c;font-size:13px;">Телефон</td>
                            <td style="padding:10px 0;color:#fff;font-size:18px;font-weight:900;text-align:right;">
                              <a href="tel:${escapeHtml(order.phone)}" style="color:#fff;text-decoration:none;">
                                ${escapeHtml(order.phone)}
                              </a>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:10px 0;color:#bda69c;font-size:13px;">Комментарий</td>
                            <td style="padding:10px 0;color:#fff;font-size:14px;font-weight:700;text-align:right;">${escapeHtml(order.comment || '—')}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:0 32px 28px 32px;">
                        <div style="border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;background:rgba(19,9,7,0.58);">
                          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                            <thead>
                              <tr style="background:rgba(217,128,141,0.14);">
                                <th style="padding:14px;text-align:left;color:#bda69c;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Букет</th>
                                <th style="padding:14px;text-align:center;color:#bda69c;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Кол-во</th>
                                <th style="padding:14px;text-align:right;color:#bda69c;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Сумма</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${itemsHtml}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:0 32px 34px 32px;">
                        <div style="padding:22px;border:1px solid rgba(217,128,141,0.45);border-radius:18px;background:linear-gradient(135deg,rgba(217,128,141,0.18),rgba(217,128,141,0.04));">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color:#bda69c;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">
                                Сумма заказа
                              </td>

                              <td style="color:#fff;font-size:28px;font-weight:900;text-align:right;">
                                ${formatMoney(order.totalPrice)}
                              </td>
                            </tr>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:18px 4px 0 4px;color:#7d655c;font-size:12px;line-height:1.5;text-align:center;">
                  Это автоматическое уведомление с сайта "Тайна вкуса".
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { text, html };
}

async function sendOrderEmail(order) {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.TO_EMAIL
  ) {
    console.warn('SMTP не настроен. Письмо не отправлено.');
    return;
  }

  const { text, html } = formatOrderEmail(order);

  await transporter.sendMail({
    from: `"Тайна вкуса" <${process.env.SMTP_USER}>`,
    to: process.env.TO_EMAIL,
    subject: `Новая заявка №${order.id} — Тайна вкуса`,
    text,
    html,
  });
}

router.post('/', async (req, res) => {
  try {
    const body = req.body;

    if (isHoneypotFilled(body)) {
      return res.status(400).json({
        message: 'Заявка не прошла проверку',
      });
    }

    if (isTooFast(body)) {
      return res.status(429).json({
        message: 'Слишком быстрая отправка формы',
      });
    }

    if (body.privacyAccepted !== 'yes') {
      return res.status(400).json({
        message: 'Нужно согласиться с обработкой персональных данных',
      });
    }

    const name = normalizeString(body.name, 80);
    const phone = normalizePhone(body.phone);
    const comment = normalizeString(body.comment, 500);
    const orderItems = await buildOrderItems(body);

    if (name.length < 2) {
      return res.status(400).json({
        message: 'Введите имя',
      });
    }

    if (!phone) {
      return res.status(400).json({
        message: 'Введите корректный телефон',
      });
    }

    if (body.type === 'cart' && !orderItems.length) {
      return res.status(400).json({
        message: 'Корзина пуста или товары недоступны',
      });
    }

    const totalPrice = orderItems.reduce((sum, item) => {
      return sum + item.priceSnapshot * item.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        customerName: name,
        phone,
        type: body.type === 'cart' ? 'cart' : 'quick',
        comment,
        totalPrice,
        status: 'new',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    try {
      await sendOrderEmail(order);
    } catch (emailError) {
      console.error('Order email error:', emailError);
    }

    res.status(201).json({
      message: 'Заявка отправлена',
      orderId: order.id,
    });
  } catch (error) {
    console.error('Order create error:', error);

    res.status(500).json({
      message: 'Ошибка отправки заявки',
    });
  }
});

module.exports = router;
