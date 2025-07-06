require("dotenv").config();
const express = require("express");
const path = require("path");
const logger = require("morgan");
const session = require("express-session");
const DButils = require("./routes/utils/DButils");
const cors = require("cors");

const app = express();

// Log requests
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie/session setup
const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: "template",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,  
      sameSite: isProduction ? "none" : "lax", 
    },
  })
);

const corsConfig = {
  origin: ["https://wtfood.cs.bgu.ac.il", "http://localhost:8080"],
  credentials: true,
};
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));


// Static files
app.use(express.static(path.join(__dirname, '../assignment3-3-316352715_209196104_assignment2/dist')));

// Cookie middleware
app.use(async (req, res, next) => {
  try {
    if (req.session?.user_id) {
      const users = await DButils.execQuery("SELECT user_id FROM users");
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
      }
    }
    next();
  } catch {
    next();
  }
});

// Routes
app.get("/alive", (req, res) => res.send("I'm alive"));
app.use("/users", require("./routes/users.js"));
app.use("/recipes", require("./routes/recipes"));
app.use("/auth", require("./routes/auth"));

// Frontend fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, '../assignment3_3-frontend-main/dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});

// // Start server
// const port = process.env.PORT || 3000;
// const server = app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });

// process.on("SIGINT", () => {
//   server && server.close(() => console.log("Server closed"));
//   process.exit();
// });
module.exports = app;
