const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");




/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */

async function getFamilyRecipes(recipe_id = null) {
  let recipes;
  if (!recipe_id) {
    recipes = await DButils.execQuery(`SELECT * FROM family_recipes`);
  } else {
    recipes = await DButils.execQuery(
      `SELECT * FROM family_recipes WHERE recipe_id='${recipe_id}'`
    );
  }

  return recipes.map(r => ({
    id: r.recipe_id,
    title: r.name,
    image: r.img,
    readyInMinutes: r.time,
    popularity: r.popularity,
    vegan: r.isVegan === 1,
    vegetarian: r.isVegetarian === 1,
    glutenFree: r.isGlutenFree === 1,
    ingredients: (() => {
      try {
        return r.ingredients ? JSON.parse(r.ingredients) : [];
      } catch (e) {
        console.warn(`Invalid JSON in ingredients for recipe_id=${r.recipe_id}:`, e.message);
        return [r.ingredients]; // fallback – wrap raw string in array
      }
    })(),
    instructions: r.instructions,
    description: r.description,
    familyMember: r.passed_down_by,
    origin: r.originator,
    occasion: r.occasion,
    story: r.story,
    created_at: r.created_at
  }));
}

async function getSpoonacularRecipesPreview(limit = 50, offset = 0) {
  const response = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      apiKey: process.env.spooncular_apiKey,
      number: limit,
      offset: offset,
      addRecipeInformation: false, 
    }
  });

  return response.data.results.map(r => ({
    id: r.id,
    title: r.title,
    image: r.image
  }));
}


async function getUserRecipes(user_id, recipe_id=null) {
  let recipes;
  if(recipe_id) {
      recipes = await DButils.execQuery(
      `SELECT * FROM PersonalRecipes WHERE user_id='${user_id}' AND id_recipe='${recipe_id}'`
    );
  }else {  
    recipes = await DButils.execQuery(
  `SELECT * FROM PersonalRecipes WHERE user_id='${user_id}'`
);
  }
  return recipes.map(r => ({
    id_recipe: r.recipe_id,
    title: r.name,
    image: r.img,
    readyInMinutes: r.time,
    popularity: r.popularity,
    vegan: r.isVegan === 1,
    vegetarian: r.isVegetarian === 1,
    glutenFree: r.isGlutenFree === 1
  }));
}

async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

{
    "title": "Anchovies Appetizer With Breadcrumbs & Scallions",
    "readyInMinutes": 15,
    "image": "https://img.spoonacular.com/recipes/2-556x370.jpg",
    "popularity": 0,
    "vegan": false,
    "vegetarian": false,
    "glutenFree": false,
    "instructions": "<ol><li>Preheat oven to 400 F.</li><li>Remove crusts from bread and cut into bite-sized croutons.</li><li>Rub garlic in bottom of a small oven-safe skillet, add 2 teaspoons olive oil.</li><li> Rub croutons in oil until they absorb it all. </li><li>Bake for 7-10 minutes or until deep golden brown. </li><li>Remove and set aside.</li><li>Slice anchovies in thirds. </li><li>Toss with scallions. </li><li>Divide into small cups, ramekins or bowls between 4 and 8 ounces and nestle in the croutons.</li></ol>"
}
async function getLocalRecipesPreview() {
  const dbRecipes = await DButils.execQuery("SELECT * FROM PersonalRecipes");

  return dbRecipes.map((r) => ({
    id: r.recipe_id,
    title: r.name,
    image: r.img,
    readyInMinutes: r.time,
    popularity: r.popularity,
    vegan: r.isVegan === 1,
    vegetarian: r.isVegetarian === 1,
    glutenFree: r.isGlutenFree === 1,
  }));
}


async function saveUserRecipe(body, user_id) {
  const {
    img, name, time,
    popularity, isVegan, isVegetarian,
    isGlutenFree,
    ingredients, instructions, description
  } = body;

  await DButils.execQuery(
    `INSERT INTO PersonalRecipes 
    (user_id, name, img, time, popularity, isVegan, isVegetarian, isGlutenFree, ingredients, instructions, description)
    VALUES (
      '${user_id}', 
      '${name}', 
      '${img}', 
      '${time}', 
      '${popularity}', 
      '${isVegan ? 1 : 0}', 
      '${isVegetarian ? 1 : 0}', 
      '${isGlutenFree ? 1 : 0}', 
      '${JSON.stringify(ingredients)}', 
      '${instructions}', 
      '${description}' 

    )`
  );
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
exports.saveUserRecipe = saveUserRecipe;
exports.getSpoonacularRecipesPreview = getSpoonacularRecipesPreview;
exports.getLocalRecipesPreview = getLocalRecipesPreview;
exports.getUserRecipes = getUserRecipes;
exports.getFamilyRecipes = getFamilyRecipes;

