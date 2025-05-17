const mongoose = require("mongoose");

const newsLetterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],

  },
});
module.exports = mongoose.model("NewsLetter", newsLetterSchema);


