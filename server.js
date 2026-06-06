const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

dotenv.config();

const productsRoutes = require("./routes/products.routes");
const ordersRoutes = require("./routes/orders.routes");

const app = express();
const PORT = process.env.PORT || 3000;

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(cors());

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use("/site", express.static(path.join(__dirname, "site")));

app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/catalog.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "catalog.html"));
});

app.get("/product.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product.html"));
});

app.get("/product/:slug", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "product.html"));
});

app.get("/cart.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cart.html"));
});

app.get("/contacts.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contacts.html"));
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    project: "Тайна вкуса",
  });
});

app.listen(PORT, () => {
  console.log(`Тайна вкуса запущен: http://localhost:${PORT}`);

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn("SMTP не настроен. Проверь .env");
    return;
  }

  mailTransporter.verify((error) => {
    if (error) {
      console.error("SMTP ошибка:", error.message);
      return;
    }

    console.log("SMTP готов к отправке писем");
  });
});
