require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { execSync } = require("child_process");
const mongoose = require("./mongodb");
const Company = require("../models/company");
const User = require("../models/user");
const Resume = require("../models/resume");
const { removeStopWords } = require("../models/utils");
const { bucket } = require('./gcsClient');
const { uploadToCloudStorage } = require('./gcsClient');
const authenticateToken = require("./auth");
const { generateSignedUrl } = require("./gcsClient");

if (!process.env.JWT_SECRET) {
  process.exit(1);
}

const app = express();

app.use((req, res, next) => {
  const lang = req.query.lang || req.headers["accept-language"]?.split(',')[0].slice(0, 2) || "en";
  const filePath = path.join(__dirname, `../locales/${lang}.json`);

  if (fs.existsSync(filePath)) {
    req.messages = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } else {
    req.messages = JSON.parse(fs.readFileSync(path.join(__dirname, "../locales/en.json"), "utf8"));
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: req.messages.email_or_password_invalid });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: req.messages.user_registered });
  } catch (error) {
    res.status(500).json({ success: false, message: req.messages.server_error });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: req.messages.email_or_password_invalid });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: req.messages.email_or_password_invalid });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ success: true, message: req.messages.user_login });
  } catch (error) {
    res.status(500).json({ success: false, message: req.messages.server_error });
  }
});

app.post("/companies", async (req, res) => {
  try {
    if (!req.body.name || !req.body.address) {
      return res.status(400).json({ success: false, message: "Company name and address are required" });
    }

    const company = new Company(req.body);
    await company.save();
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only pdf, txt, doc, and docx files are allowed"));
    }
    cb(null, true);
  },
});

app.post("/upload/resume", authenticateToken, upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files;
    const { email, phone, location } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: req.messages.no_files_uploaded });
    }

    const uploadedFiles = [];
    for (const file of files) {
      try {
        const gcsFileName = await uploadToCloudStorage(file.path, file.originalname);
        const resume = new Resume({
          original_name: file.originalname,
          original_file: file.path,
          pdf_file: gcsFileName,
          email: email || "",
          phone: phone || "",
          location: location || "",
        });

        await resume.save();

        uploadedFiles.push({
          originalName: file.originalname,
          storedFileName: gcsFileName,
        });
      } catch (err) {
        console.error(`Error uploading file ${file.originalname}:`, err);
        return res.status(500).json({ success: false, message: req.messages.upload_failed.replace("{file}", file.originalname) });
      } finally {
        fs.unlinkSync(file.path);
      }
    }

    res.status(200).json({
      success: true,
      message: req.messages.files_uploaded_successfully,
      data: uploadedFiles,
    });
  } catch (err) {
    console.error("Error handling file upload:", err);
    res.status(500).json({ success: false, message: req.messages.server_error });
  }
});
app.get("/file/signed-url", authenticateToken, async (req, res) => {
  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({ success: false, message: "File name is required" });
  }

  try {
    const signedUrl = await generateSignedUrl(fileName);
    res.status(200).json({
      success: true,
      message: "Signed URL generated successfully",
      data: { signedUrl },
    });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    res.status(500).json({
      success: false,
      message: "Failed to generate signed URL",
    });
  }
});

app.listen(3000);