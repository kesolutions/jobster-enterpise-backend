const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const resumeSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
  },
  original_name: {
    type: String,
    required: true,
  },
  original_file: {
    type: String,
    required: true,
  },
  pdf_file: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  content_sterilized: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  location: {
    type: String,
  },
}, { timestamps: true });

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;
