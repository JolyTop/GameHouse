const express = require("express");
const router = express.Router();
const Article = require("../models/Article");
const auth = require("../middleware/auth");
const User = require("../models/User");

router.get("/", async (req, res) => {
  try {
    const { category, tag, page = 1, limit = 10, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (tag) query.tags = tag;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const articles = await Article.find(query)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Article.countDocuments(query);

    res.json({
      articles,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении статей" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate("author", "username avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username avatar",
        },
      });

    if (!article) {
      return res.status(404).json({ error: "Статья не найдена" });
    }

    article.views += 1;
    await article.save();

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении статьи" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const article = new Article({
      ...req.body,
      author: req.user._id,
    });
    await article.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { articles: article._id },
    });
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ error: "Ошибка при создании статьи" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Статья не найдена" });
    }

    if (
      article.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Нет прав на редактирование" });
    }

    Object.assign(article, req.body);
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(400).json({ error: "Ошибка при обновлении статьи" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Статья не найдена" });
    }

    if (
      article.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Нет прав на удаление" });
    }

    await Article.deleteOne({ _id: article._id });
    res.json({ message: "Статья удалена" });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при удалении статьи" });
  }
});

router.post("/:id/like", auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ error: "Стаття не знайдена" });

    const userId = req.user._id.toString();
    const index = article.likedBy.findIndex((id) => id.toString() === userId);

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ error: "Користувача не знайдено" });

    if (index === -1) {
      article.likedBy.push(userId);
      article.likes += 1;
      // Добавить в избранное
      if (!user.favorites.includes(article._id)) {
        user.favorites.push(article._id);
      }
    } else {
      article.likedBy.splice(index, 1);
      article.likes -= 1;
      // Удалить из избранного
      user.favorites = user.favorites.filter(
        (favId) => favId.toString() !== article._id.toString()
      );
    }
    await article.save();
    await user.save();
    res.json({ likes: article.likes, liked: index === -1 });
  } catch (e) {
    res.status(500).json({ error: "Помилка при лайкуванні статті" });
  }
});

router.post("/:id/react", auth, async (req, res) => {
  try {
    const { type } = req.body; // type: 'heart', 'fire', 'thumbsUp', 'thumbsDown'
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: "Статтю не знайдено" });
    }

    // Инициализируем массивы реакций, если их нет
    if (!article.reactions) {
      article.reactions = {
        heart: [],
        fire: [],
        thumbsUp: [],
        thumbsDown: [],
      };
    }

    const userId = req.user._id;
    const hasReacted = article.reactions[type].includes(userId);

    if (hasReacted) {
      // Убрать реакцию
      article.reactions[type] = article.reactions[type].filter(
        (id) => !id.equals(userId)
      );
    } else {
      // Добавить реакцию
      article.reactions[type].push(userId);
    }

    await article.save();

    // Возвращаем обновленные данные
    const reactionCounts = {
      heart: article.reactions.heart.length,
      fire: article.reactions.fire.length,
      thumbsUp: article.reactions.thumbsUp.length,
      thumbsDown: article.reactions.thumbsDown.length,
    };

    res.json({
      reactions: reactionCounts,
      userReactions: {
        heart: article.reactions.heart.includes(userId),
        fire: article.reactions.fire.includes(userId),
        thumbsUp: article.reactions.thumbsUp.includes(userId),
        thumbsDown: article.reactions.thumbsDown.includes(userId),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Помилка при оновленні реакції" });
  }
});

module.exports = router;
