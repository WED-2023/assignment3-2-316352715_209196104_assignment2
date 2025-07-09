const axios = require("axios");
const path = require("path");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");
const { Result } = require("express-validator");

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.spoonacular_apiKey) {
  throw new Error("❌ Missing Spoonacular API key! Check your .env file and its path.");
}




/**
 * Get recipes list from spoonacular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */



async function getSpoonacularRecipesPreview(limit = 50, offset = 0) {
  const response = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      apiKey: process.env.spoonacular_apiKey,
      number: limit,
      offset: offset,
      addRecipeInformation: true, 
    }
  });

  return response.data.results.map(r => ({
  id: r.id,
  title: r.title,
  image: r.image,
  ...parseDietFlags(r),  
  readyInMinutes: r.readyInMinutes,
  popularity: r.aggregateLikes || 0
}));

}


async function getLocalRecipeDetails(recipe_id) {
  const result = await DButils.execQuery(
    `SELECT * FROM recipes WHERE recipe_id = ?`,
    [recipe_id]
  );

  if (result.length === 0) {
    throw { status: 404, message: "Recipe not found" };
  }

  const r = result[0];
return {
  id: r.recipe_id,
  title: r.title,
  image: r.img,
  readyInMinutes: r.time,
  popularity: r.popularity,
  isVegan: r.isVegan === 1,
  isVegetarian: r.isVegetarian === 1,
  isGlutenFree: r.isGlutenFree === 1,
  ingredients: (() => {
    try {
      return r.ingredients ? JSON.parse(r.ingredients) : [];
    } catch {
      return [r.ingredients];
    }
  })(),
  instructions: r.instructions,
  description: r.description
};

}




async function addToRecentlyViewed(user_id, recipe_id) {
  if (typeof recipe_id === "object") {
  recipe_id = recipe_id.recipe_id || recipe_id.id || recipe_id.toString();
}

  // Delete duplicate entry
  await DButils.execQuery(
    "DELETE FROM recent_recipes WHERE user_id = ? AND recipe_id = ?",
    [user_id, recipe_id]
  );

  // Get existing entries for this user
  const existing = await DButils.execQuery(
    "SELECT id FROM recent_recipes WHERE user_id = ? ORDER BY viewed_at ASC",
    [user_id]
  );

  // If already 3 entries, delete the oldest
  // if (existing.length >= 3) {
  //   const oldestId = existing[0].id;
  //   await DButils.execQuery("DELETE FROM recent_recipes WHERE id = ?", [oldestId]);
  // }

  // Insert new entry
  await DButils.execQuery(
    "INSERT INTO recent_recipes (user_id, recipe_id) VALUES (?, ?)",
    [user_id, recipe_id]
  );
}



async function saveUserRecipe(body, user_id) {
  const {
    img, title, time,
    popularity, isVegan, isVegetarian,
    isGlutenFree,
    ingredients, instructions, description
  } = body;

  const result = await DButils.execQuery(`
    SELECT recipe_id FROM recipes 
    WHERE recipe_id LIKE 'L%' 
    ORDER BY CAST(SUBSTRING(recipe_id, 2) AS UNSIGNED) DESC 
    LIMIT 1
  `);

  let newId;
  if (result.length === 0) {
    newId = "L1";
  } else {
    const lastIdNum = parseInt(result[0].recipe_id.slice(1));
    newId = `L${lastIdNum + 1}`;
  }
  console.log("Saving recipe for user_id:", user_id);
  console.log("New recipe ID:", newId);  
  await DButils.execQuery(
  `INSERT INTO recipes 
  (recipe_id, user_id, title, img, time, popularity, isVegan, isVegetarian, isGlutenFree, ingredients, instructions, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    newId,
    user_id,
    title ?? null,
    img ?? null,
    time ?? null,
    popularity ?? 0,
    isVegan ? 1 : 0,
    isVegetarian ? 1 : 0,
    isGlutenFree ? 1 : 0,
    JSON.stringify(ingredients ?? []),
    instructions ?? null,
    description ?? null
  ]
);

  return newId;
}

function parseIngredients(raw) {
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [raw];
  }
}

function parseDietFlags(r) {
  return {
    isVegan: r.vegan === true || r.isVegan === 1,
    isVegetarian: r.vegetarian === true || r.isVegetarian === 1,
    isGlutenFree: r.glutenFree === true || r.isGlutenFree === 1
  };
}

async function getFamilyRecipes(recipe_id = null) {
  const recipes = recipe_id
    ? await DButils.execQuery(`SELECT * FROM family_recipes WHERE recipe_id='${recipe_id}'`)
    : await DButils.execQuery(`SELECT * FROM family_recipes`);

  return recipes.map(r => ({
    id: r.recipe_id,
    title: r.title,
    image: r.img,
    readyInMinutes: r.time,
    popularity: r.popularity,
    ...parseDietFlags(r),
    ingredients: parseIngredients(r.ingredients),
    instructions: r.instructions,
    description: r.description,
    familyMember: r.passed_down_by,
    originator: r.originator,
    occasion: r.occasion,
    story: r.story,
    created_at: r.created_at
  }));
}

async function searchSpoonacularRecipes(params) {
  const response = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      apiKey: process.env.spoonacular_apiKey,
      query: params.title || '',
      cuisine: params.cuisine,
      diet: params.diet,
      intolerance: params.intolerance,
      number: params.limit || 10,
      offset: params.skip || 0,
      addRecipeInformation: true
    }
  });

  return response.data.results.map(r => ({
    id: r.id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes,
    popularity: r.aggregateLikes || 0,
    ...parseDietFlags(r)
  }));
}

async function getRecipeInformation(recipe_id) {
  return await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: { includeNutrition: false, apiKey: process.env.spoonacular_apiKey }
  });
}

async function getRecipeDetails(recipe_id) {
  if (typeof recipe_id === 'object') {
    recipe_id = recipe_id.recipe_id || recipe_id.id || recipe_id.toString();
  }

  if (/^L\d+$/i.test(recipe_id)) {
    const [r] = await DButils.execQuery("SELECT * FROM recipes WHERE recipe_id = ?", [recipe_id]);
    if (!r) throw { status: 404, message: "Local recipe not found" };

    return {
      id: r.recipe_id,
      title: r.title,
      image: r.img,
      readyInMinutes: r.time,
      popularity: r.popularity,
      ...parseDietFlags(r),
      ingredients: parseIngredients(r.ingredients),
      instructions: r.instructions,
      description: r.description
    };
  } else {
    const r = (await getRecipeInformation(recipe_id)).data;
    return {
      id: r.id,
      title: r.title,
      image: r.image,
      readyInMinutes: r.readyInMinutes,
      popularity: r.aggregateLikes || 0,
      ...parseDietFlags(r),
      ingredients: r.extendedIngredients?.map(i => i.original),
      instructions: r.instructions,
      description: r.summary
    };
  }
}

async function getLocalRecipesPreview(title = null) {
  const query = title ? "SELECT * FROM recipes WHERE title LIKE ?" : "SELECT * FROM recipes";
  const params = title ? [`%${title}%`] : [];
  const dbRecipes = await DButils.execQuery(query, params);

  return dbRecipes.map(r => ({
    id: r.recipe_id,
    title: r.title,
    image: r.img,
    readyInMinutes: r.time,
    popularity: r.popularity,
    ...parseDietFlags(r)
  }));
}

async function getUserRecipes(user_id, recipe_id = null) {
  const query = recipe_id
    ? `SELECT * FROM recipes WHERE user_id='${user_id}' AND recipe_id='${recipe_id}'`
    : `SELECT * FROM recipes WHERE user_id='${user_id}'`;
  const recipes = await DButils.execQuery(query);

  return recipes.map(r => ({
    id: r.recipe_id,
    title: r.title,
    image: r.img,
    readyInMinutes: r.time,
    popularity: r.popularity,
    ...parseDietFlags(r)
  }));
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

function normalizeRecipeId(obj) {
  if (!obj) return null;
  if (typeof obj === 'object') {
    return obj.recipe_id || obj.id || null;
  }
  return obj;
}

async function getRecipesPreview(recipes_id_list) {
  const previews = [];

  for (const raw of recipes_id_list) {
    const id = normalizeRecipeId(raw);
    if (!id) {
      console.warn(`Skipping invalid recipe_id:`, raw);
      continue;
    }

    try {
      const preview =
        /^L\d+$/i.test(id)
          ? await getLocalRecipeDetails(id)
          : /^F\d+$/i.test(id)
          ? (await getFamilyRecipes(id))[0]
          : await getRecipeDetails(id); // Spoonacular

      previews.push(preview);
    } catch (err) {
      console.warn(`Failed to load recipe ${id}:`, err.message || err);
    }
  }

  return previews;
}



async function getRandomSpoonacularRecipesPreview(count = 3) {
  const response = await axios.get(`${api_domain}/random`, {
    params: {
      apiKey: process.env.spoonacular_apiKey,
      number: count
    }
  });

  return response.data.recipes.map(r => ({
    id: r.id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes,
    popularity: r.aggregateLikes || 0,
    isVegan: r.vegan,
    isVegetarian: r.vegetarian,
    isGlutenFree: r.glutenFree
  }));
};

async function getViewedRecipesIDS(user_id){
  const result = await DButils.execQuery(
    `
    SELECT recipe_id 
    FROM recent_recipes 
    WHERE user_id = ? 
    `,
    [user_id]
  );
  return result;
};

async function getViewedRecipesPreview(user_id) {

  const result = await DButils.execQuery(
    `
    SELECT recipe_id 
    FROM recent_recipes 
    WHERE user_id = ? 
    ORDER BY viewed_at DESC 
    LIMIT 3
    `,
    [user_id]
  );

  const recipeIds = result.map((r) =>
    typeof r.recipe_id === "object"
      ? r.recipe_id.recipe_id || r.recipe_id.id || r.recipe_id.toString()
      : r.recipe_id
  );

  const fullDetails = [];

  for (const id of recipeIds) {
    try {
      let recipe;

      if (/^L\d+$/i.test(id)) {
        recipe = await getLocalRecipeDetails(id);
      } else if (/^F\d+$/i.test(id)) {
        recipe = (await getFamilyRecipes(id))[0];
      } else {
        recipe = await getRecipeDetails(id); // Spoonacular
      }

      fullDetails.push(recipe);
    } catch (err) {
      console.warn(`⚠️ Failed to load recipe ${id}:`, err.message || err);
    }
  }

  return fullDetails;
}




module.exports = {
  getFamilyRecipes,
  searchSpoonacularRecipes,
  getRecipeDetails,
  getRecipeInformation,
  getLocalRecipesPreview,
  getUserRecipes,
  getUserFamilyRecipes,
  getUserCreatedRecipes,
  getRecipesPreview,
  saveUserRecipe,
  getSpoonacularRecipesPreview,
  getRandomSpoonacularRecipesPreview, 
  getViewedRecipesPreview,
  getLocalRecipeDetails,
  addToRecentlyViewed,
  getViewedRecipesIDS
};
