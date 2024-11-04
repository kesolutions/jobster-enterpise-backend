require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("./mongodb");
const Company = require("../models/company");
const User = require("../models/user");

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET in environment variables");
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
    console.error("Error registering user:", error);
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
    console.error("Error logging in:", error);
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
    console.error("Error creating company:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
