var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const { route } = require("./user");

router.get("/", async (req, res, next) => {
  try {
    const queryParams = req.query;

    let externalRecipes;

    const hasSearchParams = Object.keys(queryParams).length > 0;

    if (hasSearchParams) {
      externalRecipes = await recipes_utils.searchSpoonacularRecipes(queryParams);
    } else {
      externalRecipes = await recipes_utils.getSpoonacularRecipesPreview(10, 0);
    }

    const localRecipes = await recipes_utils.getLocalRecipesPreview();
    const allRecipes = [...localRecipes, ...externalRecipes];

    res.status(200).send(allRecipes);
  } catch (err) {
    next(err);
  }
});
router.get("/myRecipes", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }
    const user_id = req.session.user_id;
    const recipes = await recipes_utils.getUserRecipes(user_id);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});
router.get("/myRecipes/:id", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }
    const user_id = req.session.user_id;
    const recipe = await recipes_utils.getUserRecipes(user_id, req.params.id);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
});


router.get("/family-recipes", async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }
    const recipes = await recipes_utils.getFamilyRecipes();
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/family-recipes/:id", async (req, res, next) => { 
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).send({ message: "User not logged in" });
    }
    const recipe = await recipes_utils.getFamilyRecipeDetails(req.params.id);
    res.status(200).send(recipe);
  } catch (error) {
    next(error);
  }
}
);


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:id", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.id);
    const recipe_id = recipe.id;
    res.send(recipe);

    if (req.session && req.session.user_id) {
      if (!req.session.viewedRecipes) {
        req.session.viewedRecipes = [];
      }
      if (!req.session.viewedRecipes.includes(recipe_id)) {
        req.session.viewedRecipes.push(recipe_id);
      }
    }

  } catch (error) {
    next(error);
  }
});


router.post("/", async(req,res,next) => {
    try{
      const requiredFields = [
        "img", "name", "time",
        "popularity", "isVegan", "isVegetarian",
        "isGlutenFree","ingredients","instructions"
      ];
      console.log("BODY:", req.body);
      console.log("params:", req.params);

      //check if the required fields are not null

      for (const field of requiredFields) {
        if (!(field in req.body)) {
          return res.status(400).send({ message: `Missing field: ${field}` });
        } 
      } 
      //check if the user is loged in 
      if (!req.session || !req.session.user_id){
        return res.status(401).send({message:"User not logged in" })
      }
      const user_id = req.session.user_id;
      await recipes_utils.saveUserRecipe(req.body,user_id)
      res.status(201).send({message:"Recipe saved successfully"})
      
}catch(err){
  next(err);
}
});




module.exports = router;
