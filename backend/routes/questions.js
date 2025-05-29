const express = require("express");
const router = express.Router();
const Question = require("../models/Question");

// GET /api/questions — получить все вопросы
router.get("/", async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении вопросов" });
  }
});

module.exports = router;
// POST /api/questions — добавить вопрос (только для отладки!)
router.post("/", async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    res.status(400).json({ error: "Ошибка при добавлении вопроса" });
  }
});
