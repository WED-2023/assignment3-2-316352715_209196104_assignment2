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


async function getUserById(user_id) {
  const result = await DButils.execQuery(
    `SELECT user_id, username, firstname, lastname, email, country, profilepic FROM users WHERE user_id = ?`,
    [user_id]
  );
  return result[0];
}

async function updateUserById(user_id, newData) {
  const currentUser = await getUserById(user_id);

  await DButils.execQuery(
    `UPDATE users 
     SET firstname = ?, lastname = ?, email = ?, country = ?, profilepic = ?
     WHERE user_id = ?`,
    [
      newData.firstname || currentUser.firstname,
      newData.lastname || currentUser.lastname,
      newData.email || currentUser.email,
      newData.country || currentUser.country,
      newData.profilepic || currentUser.profilepic,
      user_id
    ]
  );

  return await getUserById(user_id);
}


module.exports = {
  getFavoriteRecipes,
  markAsFavorite,
  getUserById,
  updateUserById
};

