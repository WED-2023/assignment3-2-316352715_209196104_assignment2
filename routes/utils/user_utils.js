const DButils = require("./DButils");

async function getFavoriteRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    "SELECT recipe_id FROM user_favorites WHERE user_id = ?",
    [user_id]
  );
  return recipes_id;
}

async function markAsFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    "INSERT INTO user_favorites (user_id, recipe_id) VALUES (?, ?)",
    [user_id, recipe_id]
  );
}

module.exports = {
  getFavoriteRecipes,
  markAsFavorite
};
