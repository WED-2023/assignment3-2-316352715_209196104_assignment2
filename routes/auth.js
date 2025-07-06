const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const DButils = require("../routes/utils/DButils");
require("dotenv").config();

// POST /auth/register
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 8 })
      .withMessage("Username must be between 3 and 8 characters"),
    body("firstname").notEmpty().withMessage("First name is required"),
    body("lastname").notEmpty().withMessage("Last name is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("email").isEmail().withMessage("Email is invalid"),
    body("password")
      .matches(/^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{5,10}$/)
      .withMessage(
        "Password must be 5–10 characters, include a number and special char"
      ),
  ],
  async (req, res) => {
    // validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const { username, firstname, lastname, country, password, email } = req.body;

      // check for duplicate username
      const userExists = await DButils.execQuery(
        "SELECT username FROM users WHERE username = ?",
        [username]
      );
      if (userExists.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Username already taken",
        });
      }

      // hash password
      const hashedPassword = bcrypt.hashSync(
        password,
        parseInt(process.env.bcrypt_saltRounds)
      );

      // insert into DB
      await DButils.execQuery(
        `INSERT INTO users (username, firstname, lastname, country, password, email) VALUES (?, ?, ?, ?, ?, ?)`,
        [username, firstname, lastname, country, hashedPassword, email]
      );

      res.status(201).json({
        success: true,
        message: "User created successfully",
      });
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      // handle duplicate entry (unique constraints)
      if (error.code === "ER_DUP_ENTRY") {
        if (error.sqlMessage?.includes("users.email")) {
          return res.status(409).json({
            success: false,
            message: "Email already in use",
          });
        }
        if (error.sqlMessage?.includes("users.username")) {
          return res.status(409).json({
            success: false,
            message: "Username already taken",
          });
        }
        return res.status(409).json({
          success: false,
          message: "Duplicate entry",
        });
      }

      // default internal error
      res.status(500).json({
        success: false,
        message: error.message || "Unknown internal error",
      });
    }
  }
);

// P// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // שליפה מלאה של המשתמש
    const users = await DButils.execQuery("SELECT * FROM users WHERE username = ?", [username]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username or password incorrect",
      });
    }

    const user = users[0];

    // השוואת סיסמה
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: "Username or password incorrect",
      });
    }

    // ✅ יצירת סשן
    req.session.user_id = user.user_id;
    console.log("session user_id login: " + req.session.user_id);

    res.status(200).json({
      success: true,
      message: "Login succeeded",
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unknown internal error",
    });
  }
});


// POST /auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ message: "Logout failed" });
    }

    // 👇 זה הקריטי
    res.clearCookie("connect.sid", {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    res.status(200).send({ message: "Logout successful" });
  });
});


module.exports = router;
