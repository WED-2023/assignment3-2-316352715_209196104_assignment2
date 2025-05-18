const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";




/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
}

async function getUserCreatedRecipes(user_id) {
  const result = await DButils.execQuery(
    "SELECT * FROM recipes WHERE user_id = ?", [user_id]
  );
  return result;
}

async function getUserFamilyRecipes(user_id) {
  const result = await DButils.execQuery(
    "SELECT * FROM family_recipes WHERE user_id = ?", [user_id]
  );
  return result;
}

async function getRecipesPreview(recipes_id_list) {
  return Promise.all(
    recipes_id_list.map((id) => getRecipeDetails(id))
  );
}



exports.getRecipesPreview = getRecipesPreview;
exports.getUserFamilyRecipes = getUserFamilyRecipes;
exports.getUserCreatedRecipes = getUserCreatedRecipes;
exports.getRecipeDetails = getRecipeDetails;



