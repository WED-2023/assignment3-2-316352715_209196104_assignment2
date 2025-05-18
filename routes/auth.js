var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');


//post/auth/register
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 8 })
      .withMessage('Username must be between 3 and 8 characters'),
    body('firstname')
      .notEmpty()
      .withMessage('First name is required'),
    body('lastname')
      .notEmpty()
      .withMessage('Last name is required'),
    body('country')
      .notEmpty()
      .withMessage('Country is required'),
    body('email')
      .isEmail()
      .withMessage('Email is invalid'),
    body('password')
      .matches(/^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{5,10}$/)
      .withMessage('Password must be 5–10 characters, include a number and special char'),
    body('profilepic')
      .optional()
      .isURL()
      .withMessage('Profile picture must be a valid URL'),
  ], async (req, res, next) => {

    //check vaildation results
    const errors = validationResult(req);
        if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
  try {
    // parameters exists
    // valid parameters
    // username exists
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
      profilepic: req.body.profilepic ?? null
    }

    let userExists = await DButils.execQuery("SELECT username FROM users WHERE username = ?", [user_details.username]);
    if (userExists.length > 0) {
        throw { status: 409, message: "Username taken" };
      }

    // add the new username
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );

await DButils.execQuery(
  `INSERT INTO users (username, firstname, lastname, country, password, email, profilepic) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    user_details.username,
    user_details.firstname,
    user_details.lastname,
    user_details.country,
    hash_password,
    user_details.email,
    user_details.profilepic
  ]
);

    res.status(201).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    // check that username exists
    const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === req.body.username))
      throw { status: 401, message: "Username or Password incorrect" };

    // check that the password is correct
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE username = ?`,
        [req.body.username]
      )
    )[0];


    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }

    // Set cookie
    req.session.user_id = user.id;
    console.log("session user_id login: " + req.session.user_id);

    // return cookie
    res.status(200).send({ message: "login succeeded " , success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", function (req, res) {
  console.log("session user_id Logout: " + req.session.user_id);
  req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
  res.send({ success: true, message: "logout succeeded" });
});

module.exports = router;

