const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const { home, hit, sale, limit } = req.query;

    const where = {
      isActive: true,
    };

    if (home === "true") {
      where.showOnHome = true;
    }

    if (hit === "true") {
      where.isHit = true;
    }

    if (sale === "true") {
      where.isSale = true;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      take: limit ? Number(limit) : undefined,
    });

    res.json(products);
  } catch (error) {
    console.error("Products get error:", error);

    res.status(500).json({
      message: "Ошибка получения товаров",
    });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Товар не найден",
      });
    }

    res.json(product);
  } catch (error) {
    console.error("Product get error:", error);

    res.status(500).json({
      message: "Ошибка получения товара",
    });
  }
});

module.exports = router;
