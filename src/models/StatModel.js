
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statModel = new Schema(
  {
    totalViews: {
      type: Number,
      default: 0,
    },
    totalCategory: {
      type: Number,
      default: 0,
    },
    totalBlogs: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stats", statModel);

