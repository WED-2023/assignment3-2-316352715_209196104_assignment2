const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");

// Retrieve family recipes (all or specific)
async function getFamilyRecipes(recipe_id = null) {
  let recipes;
  if (!recipe_id) {
    recipes = await DButils.execQuery(`SELECT * FROM family_recipes`);
  } else {
    recipes = await DButils.execQuery(
      `SELECT * FROM family_recipes WHERE recipe_id = ?`, [recipe_id]
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
        return [];
      }
    })(),
    instructions: r.instructions,
    description: r.description,
    familyMember: r.passed_down_by,
    origin: r.originator,
    occasion: r.occasion,
    story: r.story
  }));
}

// Spoonacular preview (limited)
async function getSpoonacularRecipesPreview(limit = 50, offset = 0) {
  const response = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      apiKey: process.env.spoonacular_apiKey,
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

// Retrieve personal recipes for a user (all or specific)
async function getUserRecipes(user_id, recipe_id = null) {
  let recipes;
  if (recipe_id) {
    recipes = await DButils.execQuery(
      `SELECT * FROM recipes WHERE user_id = ? AND recipe_id = ?`,
      [user_id, recipe_id]
    );
  } else {
    recipes = await DButils.execQuery(
      `SELECT * FROM recipes WHERE user_id = ?`,
      [user_id]
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
    glutenFree: r.isGlutenFree === 1
  }));
}

// Get full details from Spoonacular API
async function getRecipeInformation(recipe_id) {
  return await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spoonacular_apiKey
    }
  });
}

async function getRecipeDetails(recipe_id) {
  const recipe_info = await getRecipeInformation(recipe_id);
  const {
    id,
    title,
    readyInMinutes,
    image,
    aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
    extendedIngredients,
    instructions,
    summary
  } = recipe_info.data;

  return {
    id_recipe: id,
    title,
    readyInMinutes,
    image,
    popularity: aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
    ingredients: extendedIngredients.map(ing => ing.original),
    instructions,
    description: summary
  };
}

// Local recipes preview
async function getLocalRecipesPreview() {
  const dbRecipes = await DButils.execQuery("SELECT * FROM recipes");

  return dbRecipes.map(r => ({
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

// Save user recipe
async function saveUserRecipe(body, user_id) {
  const {
    img,
    name,
    time,
    popularity,
    isVegan,
    isVegetarian,
    isGlutenFree,
    ingredients,
    instructions,
    description
  } = body;

  
const required = [name, img, time, popularity, ingredients, instructions, description];
if (required.some(v => v === undefined)) {
  throw new Error("Missing required fields");
}


  await DButils.execQuery(
    `INSERT INTO recipes 
    (user_id, name, img, time, popularity, isVegan, isVegetarian, isGlutenFree, ingredients, instructions, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      name,
      img,
      time,
      popularity,
      isVegan ? 1 : 0,
      isVegetarian ? 1 : 0,
      isGlutenFree ? 1 : 0,
      JSON.stringify(ingredients),
      instructions,
      description
    ]
  );
}

async function getUserCreatedRecipes(user_id) {
  const result = await DButils.execQuery(
    "SELECT * FROM recipes WHERE user_id = ?", [user_id]
  );
  return result;
}

// async function getUserFamilyRecipes(user_id) {
//   const result = await DButils.execQuery(
//     "SELECT * FROM family_recipes WHERE user_id = ?", [user_id]
//   );
//   return result;
// }

async function getRecipesPreview(recipes_id_list) {
  return Promise.all(
    recipes_id_list.map((id) => getRecipeDetails(id))
  );
}





module.exports = {
  getRecipesPreview,
  // getUserFamilyRecipes,
  getUserCreatedRecipes,
  getRecipeDetails,
  saveUserRecipe,
  getSpoonacularRecipesPreview,
  getLocalRecipesPreview,
  getUserRecipes,
  getFamilyRecipes
};