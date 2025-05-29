const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [String],
    reactions: {
      heart: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      fire: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      thumbsUp: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      thumbsDown: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Article", articleSchema);
