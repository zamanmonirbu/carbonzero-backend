const mongoose = require("mongoose");
const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    subImages: [{
      type: String
    }],
    description: {
      type: String,
      required: true,
    },
    tag: {
      type:String,
      required: true
    },
    authorName: {
      type: String,
    },
    slug: {
      type: String,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Blog", blogSchema);
