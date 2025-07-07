const express = require("express");
const router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", async (req, res, next) => {
  try {
    const queryParams = req.query;
    const limit = parseInt(queryParams.limit) || 10;
    const sortBy = queryParams.sortBy;
    const order = queryParams.order === "desc" ? "desc" : "asc";

    const nonSearchParams = new Set(["limit", "sortBy", "order"]);
    const searchParams = Object.keys(queryParams).filter(
      (key) => !nonSearchParams.has(key)
    );
    const hasSearchParams = searchParams.length > 0;

    let externalRecipes;
    let localRecipes;

    if (hasSearchParams) {
      if (req.session) {
        req.session.lastSearch = queryParams;
        console.log("session last search", req.session.lastSearch);
      }

      externalRecipes = await recipes_utils.searchSpoonacularRecipes(queryParams);
      localRecipes = await recipes_utils.getLocalRecipesPreview(queryParams.title);
    } else {
      externalRecipes = await recipes_utils.getSpoonacularRecipesPreview(limit, 0);
      localRecipes = await recipes_utils.getLocalRecipesPreview();
    }

    const allRecipes = [...localRecipes, ...externalRecipes];

    if (sortBy && ["popularity", "readyInMinutes"].includes(sortBy)) {
      allRecipes.sort((a, b) => {
        return order === "desc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy];
      });
    }

    res.status(200).send(allRecipes);
  } catch (err) {
    next(err);
  }
});

router.get("/random", async (req, res, next) => {
  try {
    const recipes = await recipes_utils.getRandomSpoonacularRecipesPreview(3);
    res.status(200).send(recipes);
  } catch (err) {
    next(err);
  }
});

router.get("/viewed", async (req, res, next) => {
  try {
    const user_id = req.session?.user_id;
    if (!user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }

    const previews = await recipes_utils.getViewedRecipesPreview(user_id);
    res.status(200).send(previews);
  } catch (err) {
    next(err);
  }
});

router.get("/myRecipes", async (req, res, next) => {
  try {
    if (!req.session?.user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }

    const recipes = await recipes_utils.getUserRecipes(req.session.user_id);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/myRecipes/:id", async (req, res, next) => {
  try {
    if (!req.session?.user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }

    const recipe = await recipes_utils.getUserRecipes(req.session.user_id, req.params.id);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});

router.get("/family-recipes", async (req, res, next) => {
  try {
    const recipes = await recipes_utils.getFamilyRecipes();
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/family-recipes/:id", async (req, res, next) => {
  try {
    if (!req.session?.user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }

    const recipe = (await recipes_utils.getFamilyRecipes(req.params.id))[0];
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const recipe_id = req.params.id;

    if (!/^\d+$/.test(recipe_id) && !/^L\d+$/i.test(recipe_id) && !/^F\d+$/i.test(recipe_id)) {
      return res.status(400).send({ message: "Invalid recipe ID format" });
    }

    let recipe;
    if (/^L\d+$/i.test(recipe_id)) {
      recipe = await recipes_utils.getLocalRecipeDetails(recipe_id);
    } else {
      recipe = await recipes_utils.getRecipeDetails(recipe_id);
    }

    if (req.session?.user_id) {
      await recipes_utils.addToRecentlyViewed(req.session.user_id, recipe_id);
    }

    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const requiredFields = [
      "img", "title", "time",
      "popularity", "isVegan", "isVegetarian",
      "isGlutenFree", "ingredients", "instructions", "description"
    ];

    for (const field of requiredFields) {
      if (!(field in req.body)) {
        return res.status(400).send({ message: `Missing field: ${field}` });
      }
    }

    if (!req.session?.user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }

    const newId = await recipes_utils.saveUserRecipe(req.body, req.session.user_id);
    res.status(201).send({ message: `Recipe with id ${newId} saved successfully` });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
