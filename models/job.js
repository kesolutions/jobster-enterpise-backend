const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const jobSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    unique: true
  },
  original_name: String,
  original_file: String,
  content: String,
  content_sterilized: String
});

module.exports = mongoose.model("Job", jobSchema);
