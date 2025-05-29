const express = require("express");
const router = express.Router();
const Poll = require("../models/Poll");
const auth = require("../middleware/auth");

// Получить все активные опросы
router.get("/", async (req, res) => {
  try {
    const polls = await Poll.find({ isActive: true })
      .populate("createdBy", "username avatar")
      .sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении опросов" });
  }
});

// Получить опрос по ID
router.get("/:id", async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate("createdBy", "username avatar")
      .populate("voters.user", "username avatar");

    if (!poll) {
      return res.status(404).json({ error: "Опрос не найден" });
    }

    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении опроса" });
  }
});

// Создать новый опрос (только админ)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Нет прав на создание опроса" });
    }

    const poll = new Poll({
      ...req.body,
      createdBy: req.user._id,
    });

    await poll.save();
    res.status(201).json(poll);
  } catch (err) {
    res.status(400).json({ error: "Ошибка при создании опроса" });
  }
});

// Проголосовать в опросе
router.post("/:id/vote", auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ error: "Опрос не найден" });
    }

    if (!poll.isActive) {
      return res.status(400).json({ error: "Опрос уже завершен" });
    }

    if (new Date() > new Date(poll.endDate)) {
      poll.isActive = false;
      await poll.save();
      return res.status(400).json({ error: "Срок голосования истек" });
    }

    // Проверяем, не голосовал ли уже пользователь
    const hasVoted = poll.voters.some(
      (voter) => voter.user.toString() === req.user._id.toString()
    );

    if (hasVoted) {
      return res.status(400).json({ error: "Вы уже голосовали в этом опросе" });
    }

    // Добавляем голос
    poll.options[optionIndex].votes += 1;
    poll.voters.push({
      user: req.user._id,
      optionIndex,
    });

    await poll.save();
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при голосовании" });
  }
});

// Удалить опрос (только админ)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Нет прав на удаление опроса" });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: "Опрос не найден" });
    }

    await Poll.deleteOne({ _id: poll._id });
    res.json({ message: "Опрос удален" });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при удалении опроса" });
  }
});

module.exports = router;
