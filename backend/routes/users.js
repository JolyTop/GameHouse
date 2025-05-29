const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

// Регистрация пользователя
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log(`Attempting to register user with email: ${email}`);

    // Проверка существования пользователя
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      console.log(
        `Registration failed: User already exists with email: ${email}`
      );
      return res.status(400).json({
        error: "Пользователь с таким email или именем уже существует",
      });
    }

    // Создание нового пользователя
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();
    console.log(`Successfully registered user: ${email}`);

    // Создание токена
    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      error: "Ошибка при регистрации",
      details: error.message,
    });
  }
});

// Вход пользователя
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for user: ${email}`);

    // Поиск пользователя
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: User not found with email: ${email}`);
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    // Проверка пароля
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for user: ${email}`);
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    console.log(`User successfully logged in: ${email}`);

    // Создание токена
    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({
      error: "Ошибка при входе",
      details: error.message,
    });
  }
});

// Получение профиля пользователя
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate({ path: "favorites", select: "-comments" });
    // Получить статьи пользователя
    const articles = await require("../models/Article")
      .find({ author: user._id })
      .sort({ createdAt: -1 });
    // Получить комментарии пользователя
    const comments = await require("../models/Comment")
      .find({ author: user._id })
      .sort({ createdAt: -1 });
    const userObj = user.toObject();
    userObj.articles = articles;
    userObj.comments = comments;
    // favorites уже популятед
    res.json(userObj);
  } catch (error) {
    console.error("Profile retrieval error:", error);
    res.status(500).json({
      error: "Ошибка при получении профиля",
      details: error.message,
    });
  }
});

// Обновление профиля пользователя
router.put("/profile", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["username", "email", "password", "bio", "avatar"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    console.log(
      `Invalid profile update attempt. Fields: ${updates.join(", ")}`
    );
    return res.status(400).json({ error: "Недопустимые поля для обновления" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    console.log(`Profile updated for user: ${req.user.email}`);
    res.json(req.user);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(400).json({
      error: "Ошибка при обновлении профиля",
      details: error.message,
    });
  }
});

// ВРЕМЕННЫЙ эндпоинт для назначения роли admin по email (после использования удалить!)
router.post("/make-admin", async (req, res) => {
  const { email, secret } = req.body;
  console.log(`Attempting to make admin: ${email}`);

  if (secret !== process.env.ADMIN_SECRET) {
    console.log(`Admin elevation failed: Invalid secret for ${email}`);
    return res.status(403).json({ error: "Недостаточно прав" });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Admin elevation failed: User not found: ${email}`);
      return res.status(404).json({ error: "Користувача не знайдено" });
    }
    user.role = "admin";
    await user.save();
    console.log(`Successfully made admin: ${email}`);
    res.json({ message: "Роль admin назначена", user });
  } catch (error) {
    console.error("Make admin error:", error);
    res.status(500).json({
      error: "Помилка сервера",
      details: error.message,
    });
  }
});

module.exports = router;
