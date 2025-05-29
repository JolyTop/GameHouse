const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");

router.get("/", quizController.getAllQuizzes);
router.post("/", quizController.createQuiz);

module.exports = router;
