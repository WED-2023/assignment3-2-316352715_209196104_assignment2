const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");



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


async function saveUserRecipe(body, user_id) {
      const {
    img, id, name, time,
    popularity, isVegan, isVegetarian,
    isGlutenFree, releaseDate
  } = body;
  
    await DButils.execQuery(
    `INSERT INTO PersonalRecipes
    (user_id, recipe_id, name, img, time, popularity, isVegan, isVegetarian, isGlutenFree, releaseDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, id, name, img, time, popularity, isVegan, isVegetarian, isGlutenFree, releaseDate]
  );    
}



exports.getRecipeDetails = getRecipeDetails;



