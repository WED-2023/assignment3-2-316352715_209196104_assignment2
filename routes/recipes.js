var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));


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


router.post("/:id", async(req,res,next) => {
    try{
      const requiredFields = [
        "img", "name", "time",
        "popularity", "isVegan", "isVegetarian",
        "isGlutenFree", "releaseDate"
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
      const recipe_id = req.params.id;
      await recipes_utils.saveUserRecipe(req.body,user_id,recipe_id)
      res.status(201).send({message:"Recipe saved successfully"})
      
}catch(err){
  next(err);
}
});




module.exports = router;
