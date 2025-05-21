var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");


/**
 * Authenticate all incoming requests by middleware
 */
router.use((req, res, next) => {
  if (!req.session || !req.session.user_id) {
    return res.sendStatus(401);
  }
  req.user_id = req.session.user_id; 
  next();
});



/**
 * This path gets body with recipeId and saves this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
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


/**
 * This path returns the favorite recipes saved by the logged-in user
 */
router.get('/favorites', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    const recipes_id_array = recipes_id.map((element) => element.recipe_id);
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);

  } catch (error) {
    next(error);
  }
});



router.get("/me", async (req, res, next) => {
  try {

    const user = await DButils.execQuery(
      `SELECT user_id, username, firstname, lastname, email, country, profilepic FROM users WHERE user_id = ?`,
      [req.session.user_id]
    );
    res.send(user[0]);
  } catch (error) {
    next(error);
  }
});
router.put("/me", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await DButils.execQuery(
      `SELECT user_id, username, firstname, lastname, email, country, profilepic FROM users WHERE user_id = ?`,
      [req.session.user_id]
    );
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await DButils.execQuery(
      `UPDATE users SET firstname = ?, lastname = ?, email = ?, country = ?, profilepic = ? WHERE user_id = ?`,
      [
        req.body.firstname || user[0].firstname,
        req.body.lastname || user[0].lastname,
        req.body.email || user[0].email,
        req.body.country || user[0].country,
        req.body.profilepic || user[0].profilepic,
        req.session.user_id
      ]
    );

    res.send(updatedUser);
  } catch (error) {
    next(error);
  }
});

router.get('/recipes', async (req, res, next) => {
    try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }


    const recipes = await recipe_utils.getUserCreatedRecipes(user_id);
    res.status(200).send(recipes);
    
  } catch (error) {
    next(error);
  }
});










module.exports = router;
