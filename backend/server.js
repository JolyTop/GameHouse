const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Загрузка переменных окружения
dotenv.config();

// Проверка загрузки переменных окружения
console.log(process.env);
console.log("Environment variables loaded:");
console.log("PORT:", process.env.PORT);
console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");
console.log("ADMIN_SECRET:", process.env.ADMIN_SECRET ? "Set" : "Not set");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gamehouseua")
  .then(() => console.log("✅ MongoDB подключена"))
  .catch((err) => console.error("❌ Ошибка MongoDB:", err));

// Подключение маршрутов
const articlesRouter = require("./routes/articles");
const usersRoute = require("./routes/users");
const commentsRouter = require("./routes/comments");
const pollsRouter = require("./routes/polls");
const uploadsRouter = require("./routes/uploads");

app.use("/api/articles", articlesRouter);
app.use("/api/users", usersRoute);
app.use("/api/comments", commentsRouter);
app.use("/api/polls", pollsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Что-то пошло не так!" });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
