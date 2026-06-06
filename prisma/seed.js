const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: {
      slug: 'buket-taina',
    },
    update: {
      title: 'Букет “Тайна”',
      category: 'Букеты',
      shortDescription:
        'Клубника в молочном и белом шоколаде с нежным декором.',
      description:
        'Авторский букет из свежей клубники в шоколаде для подарка и особенного повода.',
      composition: 'Свежая клубника, молочный шоколад, белый шоколад, декор.',
      price: 2790,
      oldPrice: 3190,
      berriesCount: 15,
      image: '/site/img/main-hero.png',
      isActive: true,
      isHit: true,
      isSale: false,
      showOnHome: true,
      sortOrder: 1,
    },
    create: {
      title: 'Букет “Тайна”',
      slug: 'buket-taina',
      category: 'Букеты',
      shortDescription:
        'Клубника в молочном и белом шоколаде с нежным декором.',
      description:
        'Авторский букет из свежей клубники в шоколаде для подарка и особенного повода.',
      composition: 'Свежая клубника, молочный шоколад, белый шоколад, декор.',
      price: 2790,
      oldPrice: 3190,
      berriesCount: 15,
      image: '/site/img/main-hero.png',
      isActive: true,
      isHit: true,
      isSale: false,
      showOnHome: true,
      sortOrder: 1,
    },
  });

  await prisma.product.upsert({
    where: {
      slug: 'buket-nezhnost',
    },
    update: {
      title: 'Букет “Нежность”',
      category: 'Букеты',
      shortDescription:
        'Нежный букет из клубники в белом шоколаде с аккуратным декором.',
      description:
        'Лёгкий и изящный букет для комплимента, свидания или небольшого подарка.',
      composition:
        'Свежая клубника, белый шоколад, кондитерский декор, упаковка.',
      price: 2190,
      oldPrice: null,
      berriesCount: 9,
      image: '/site/img/main-hero.png',
      isActive: true,
      isHit: false,
      isSale: false,
      showOnHome: true,
      sortOrder: 5,
    },
    create: {
      title: 'Букет “Нежность”',
      slug: 'buket-nezhnost',
      category: 'Букеты',
      shortDescription:
        'Нежный букет из клубники в белом шоколаде с аккуратным декором.',
      description:
        'Лёгкий и изящный букет для комплимента, свидания или небольшого подарка.',
      composition:
        'Свежая клубника, белый шоколад, кондитерский декор, упаковка.',
      price: 2190,
      oldPrice: null,
      berriesCount: 9,
      image: '/site/img/main-hero.png',
      isActive: true,
      isHit: false,
      isSale: false,
      showOnHome: true,
      sortOrder: 5,
    },
  });

  await prisma.product.upsert({
    where: {
      slug: 'buket-romantika',
    },
    update: {
      title: 'Букет “Романтика”',
      category: 'Букеты',
      shortDescription:
        'Клубника в молочном и розовом шоколаде для романтичного подарка.',
      description:
        'Эффектный букет для свидания, годовщины, дня рождения или приятного сюрприза.',
      composition:
        'Свежая клубника, молочный шоколад, розовый шоколад, посыпка, упаковка.',
      price: 3490,
      oldPrice: 3890,
      berriesCount: 21,
      image: '/site/img/main-hero.png',
      isActive: true,
      isHit: true,
      isSale: false,
      showOnHome: true,
      sortOrder: 6,
    },
    create: {
      title: 'Букет “Романтика”',
      slug: 'buket-romantika',
      category: 'Букеты',
      shortDescription:
        'Клубника в молочном и розовом шоколаде для романтичного подарка.',
      description:
        'Эффектный букет для свидания, годовщины, дня рождения или приятного сюрприза.',
      composition:
        'Свежая клубника, молочный шоколад, розовый шоколад, посыпка, упаковка.',
      price: 3490,
      oldPrice: 3890,
      berriesCount: 21,
      image: '/site/img/main-hero.png',
      isActive: true,
      isHit: true,
      isSale: false,
      showOnHome: true,
      sortOrder: 6,
    },
  });

  await prisma.product.upsert({
    where: {
      slug: 'buket-prazdnichny',
    },
    update: {
      title: 'Букет “Праздничный”',
      category: 'Букеты',
      shortDescription:
        'Большой букет из клубники в разных видах шоколада с праздничным декором.',
      description:
        'Насыщенный подарочный букет для торжества, дня рождения или важного события.',
      composition:
        'Свежая клубника, белый шоколад, молочный шоколад, тёмный шоколад, декор, упаковка.',
      price: 4290,
      oldPrice: 4790,
      berriesCount: 25,
      image: '/site/img/main-hero.png',
      isActive: true,
      isHit: false,
      isSale: true,
      showOnHome: true,
      sortOrder: 7,
    },
    create: {
      title: 'Букет “Праздничный”',
      slug: 'buket-prazdnichny',
      category: 'Букеты',
      shortDescription:
        'Большой букет из клубники в разных видах шоколада с праздничным декором.',
      description:
        'Насыщенный подарочный букет для торжества, дня рождения или важного события.',
      composition:
        'Свежая клубника, белый шоколад, молочный шоколад, тёмный шоколад, декор, упаковка.',
      price: 4290,
      oldPrice: 4790,
      berriesCount: 25,
      image: '/site/img/main-hero.png',
      isActive: true,
      isHit: false,
      isSale: true,
      showOnHome: true,
      sortOrder: 7,
    },
  });

  console.log("Тестовые букеты добавлены");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
