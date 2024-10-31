require("dotenv").config();
const express = require("express");
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { check, validationResult } = require("express-validator");
const mongoose = require("./mongodb");
const User = require("../models/user");

const app = express();
const templatePath = path.join(__dirname, '../templates');

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
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage((value, { req }) => req.messages.email_invalid || "Invalid email format"),
    check("password")
      .isLength({ min: 6 })
      .withMessage((value, { req }) => req.messages.password_length || "Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });

      await newUser.save();
      console.log(req.messages.user_registered, newUser);

      res.json({ success: true, message: req.messages.user_registered });
    } catch (error) {
      console.error(req.messages.server_error, error);
      res.status(500).json({ success: false, message: req.messages.server_error });
    }
  }
);


app.post(
  "/login",
  [
    check("email").isEmail().withMessage((value, { req }) => req.messages.email_invalid),
    check("password").notEmpty().withMessage((value, { req }) => req.messages.password_length),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

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

      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.json({ success: true, message: req.messages.user_login });
    } catch (error) {
      console.error(req.messages.server_error, error);
      res.status(500).json({ success: false, message: req.messages.server_error });
    }
  }
);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
