const express = require("express");
const router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");
const { requireLogin } = require("./utils/middleware"); // 

router.get("/me", async (req, res, next) => {
  try {
    if (!req.session?.user_id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await DButils.execQuery(
      `SELECT user_id, username, firstname, lastname, email, country FROM users WHERE user_id = ?`,
      [req.session.user_id]
    );
    res.send(user[0]);
  } catch (error) {
    next(error);
  }
});

// ===== 🔒 PRIVATE ROUTES =====
router.use(requireLogin); 

router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;

    if (!recipe_id) {
      return res.status(400).json({ message: "Missing recipeId in request body" });
    }

    const existing = await DButils.execQuery(
      `SELECT * FROM user_favorites WHERE user_id = ? AND recipe_id = ?`,
      [user_id, recipe_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Recipe is already in favorites" });
    }

    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send({ message: "The Recipe successfully saved as favorite" });

  } catch (error) {
    next(error);
  }
});

router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    const recipes_id_array = recipes_id.map((element) => element.recipe_id);
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);

  } catch (error) {
    next(error);
  }
});

router.put("/me", async (req, res, next) => {
  try {
    const user = await DButils.execQuery(
      `SELECT user_id, username, firstname, lastname, email, country FROM users WHERE user_id = ?`,
      [req.session.user_id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await DButils.execQuery(
      `UPDATE users SET firstname = ?, lastname = ?, email = ?, country = ? WHERE user_id = ?`,
      [
        req.body.firstname || user[0].firstname,
        req.body.lastname || user[0].lastname,
        req.body.email || user[0].email,
        req.body.country || user[0].country,
        req.session.user_id
      ]
    );

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.get('/recipes', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipes = await recipe_utils.getUserCreatedRecipes(user_id);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
