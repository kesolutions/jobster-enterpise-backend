const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const resumeSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    unique: true
  },
  original_name: String,
  original_file: String,
  pdf_file: String,
  content: String,
  content_sterilized: String,
  email: String,
  phone: String,
  location: String
}, { timestamps: true });

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;