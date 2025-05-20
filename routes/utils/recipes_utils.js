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

async function searchSpoonacularRecipes(params) {
  const {
    name,
    cuisine,
    diet,
    intolerance,
    limit = 10,
    skip = 0
  } = params;

  const response = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      apiKey: process.env.spooncular_apiKey,
      query: name || '',
      cuisine,
      diet,
      intolerance,
      number: limit,
      offset: skip,
      addRecipeInformation: true
    }
  });

  return response.data.results.map(r => ({
    id: r.id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes,
    popularity: r.aggregateLikes || 0,
    vegan: r.vegan,
    vegetarian: r.vegetarian,
    glutenFree: r.glutenFree
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
      `SELECT * FROM recipes WHERE user_id='${user_id}' AND recipe_id='${recipe_id}'`
    );
  }else {  
    recipes = await DButils.execQuery(
  `SELECT * FROM recipes WHERE user_id='${user_id}'`
);
  }
  return recipes.map(r => ({
    recipe_id: r.recipe_id,
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

async function getRecipeDetails(recipe_id) {
  const recipe_info = await getRecipeInformation(recipe_id);
  const {
    id, title, readyInMinutes, image, aggregateLikes,
    vegan, vegetarian, glutenFree, ingredients, instructions, description
  } = recipe_info.data;

  return {
    id,
    title,
    readyInMinutes,
    image,
    popularity: aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
    ingredients,
    instructions,
    description
  };
}

async function getLocalRecipesPreview() {
  const dbRecipes = await DButils.execQuery("SELECT * FROM recipes");

  return dbRecipes.map((r) => ({
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



async function saveUserRecipe(body, user_id) {
  const {
    img, name, time,
    popularity, isVegan, isVegetarian,
    isGlutenFree,
    ingredients, instructions, description
  } = body;
  
  const result = await DButils.execQuery(`
    SELECT id FROM recipes 
    WHERE id LIKE 'L%' 
    ORDER BY CAST(SUBSTRING(id, 2) AS UNSIGNED) DESC 
    LIMIT 1
  `);

  let newId;
  if (result.length === 0) {
    newId = "L1";
  } else {
    const lastIdNum = parseInt(result[0].id.slice(1));
    newId = `L${lastIdNum + 1}`;
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
async function getRandomSpoonacularRecipesPreview(count = 3) {
  const response = await axios.get(`${api_domain}/random`, {
    params: {
      apiKey: process.env.spooncular_apiKey,
      number: count
    }
  });

  return response.data.recipes.map(r => ({
    id: r.id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes,
    popularity: r.aggregateLikes || 0,
    vegan: r.vegan,
    vegetarian: r.vegetarian,
    glutenFree: r.glutenFree
  }));
}
async function getViewedRecipesPreview(session) {
  if (!session || !session.viewedRecipes || session.viewedRecipes.length === 0) {
    return [];
  }

  const recipeIds = session.viewedRecipes.slice(-3); 
  const previews = [];

  for (const id of recipeIds) {
    try {
      const res = await axios.get(`${api_domain}/${id}/information`, {
        params: {
          apiKey: process.env.spooncular_apiKey,
          includeNutrition: false
        }
      });

      const r = res.data;

      previews.push({
        id: r.id,
        title: r.title,
        image: r.image,
        readyInMinutes: r.readyInMinutes,
        popularity: r.aggregateLikes || 0,
        vegan: r.vegan,
        vegetarian: r.vegetarian,
        glutenFree: r.glutenFree
      });
    } catch (err) {
      console.warn(`Failed to fetch recipe ID ${id}:`, err.response?.status || err.message);
    }
  }

  return previews;
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
exports.searchSpoonacularRecipes = searchSpoonacularRecipes;
exports.getRandomSpoonacularRecipesPreview = getRandomSpoonacularRecipesPreview;
exports.getViewedRecipesPreview = getViewedRecipesPreview;