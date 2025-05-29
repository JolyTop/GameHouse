const Quiz = require("../models/Quiz");

exports.getAllQuizzes = async (req, res) => {
  const quizzes = await Quiz.find();
  res.json(quizzes);
};

exports.createQuiz = async (req, res) => {
  const { question, options, correctAnswer } = req.body;
  const quiz = new Quiz({ question, options, correctAnswer });
  await quiz.save();
  res.json(quiz);
};
