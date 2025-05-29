const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Article = require("../models/Article");
const auth = require("../middleware/auth");

// Создание комментария
router.post("/", auth, async (req, res) => {
  try {
    const { content, article, parentComment } = req.body;

    const comment = new Comment({
      content,
      author: req.user._id,
      article,
      parentComment,
    });

    await comment.save();

    // Добавление комментария к статье
    await Article.findByIdAndUpdate(article, {
      $push: { comments: comment._id },
    });

    // Если это ответ на другой комментарий, добавляем его к родительскому
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id },
      });
    }

    // Получаем полный комментарий с информацией об авторе
    const populatedComment = await Comment.findById(comment._id)
      .populate("author", "username avatar")
      .populate("parentComment");

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(400).json({ error: "Ошибка при создании комментария" });
  }
});

// Получение комментариев к статье
router.get("/article/:articleId", async (req, res) => {
  try {
    const comments = await Comment.find({
      article: req.params.articleId,
      parentComment: null, // Получаем только корневые комментарии
    })
      .populate("author", "username avatar")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "username avatar",
        },
      })
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении комментариев" });
  }
});

// Обновление комментария
router.put("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Комментарий не найден" });
    }

    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Нет прав на редактирование" });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    await comment.save();

    res.json(comment);
  } catch (error) {
    res.status(400).json({ error: "Ошибка при обновлении комментария" });
  }
});

// Удаление комментария
router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Комментарий не найден" });
    }

    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Нет прав на удаление" });
    }

    // Удаляем комментарий из статьи
    if (comment.article) {
      await Article.findByIdAndUpdate(comment.article, {
        $pull: { comments: comment._id },
      });
    }

    // Если это ответ на другой комментарий, удаляем его из родительского
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: comment._id },
      });
    }

    // Удаляем сам комментарий
    await Comment.deleteOne({ _id: comment._id });

    res.json({ message: "Комментарий удален" });
  } catch (error) {
    res.status(500).json({
      error: "Ошибка при удалении комментария",
      details: error.message,
    });
  }
});

// Получение всех комментариев (только для админов)
router.get("/all", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Тільки адміністратор може переглядати всі коментарі" });
  }
  try {
    const comments = await Comment.find({})
      .populate("author", "username avatar")
      .populate("article", "title");
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении комментариев" });
  }
});

module.exports = router;
