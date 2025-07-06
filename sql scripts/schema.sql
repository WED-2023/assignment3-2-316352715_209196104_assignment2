USE recipe_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS user_favorites;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS family_recipes;
DROP TABLE IF EXISTS recipes;
-- DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(100),
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  country VARCHAR(100),
  email VARCHAR(255) UNIQUE
);

-- Create general recipes table
CREATE TABLE recipes (
  recipe_id VARCHAR(20) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  img VARCHAR(255),
  time INT,
  popularity FLOAT,
  isVegan TINYINT(1),
  isVegetarian TINYINT(1),
  isGlutenFree TINYINT(1),
  ingredients TEXT,
  instructions TEXT,
  description TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create favorites table
CREATE TABLE user_favorites (
  user_id INT NOT NULL,
  recipe_id VARCHAR(20) NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- Create family recipes table (inherits recipe_id from recipes)
CREATE TABLE family_recipes (
  recipe_id VARCHAR(20) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  originator VARCHAR(100) NOT NULL,
  occasion VARCHAR(100),
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL
);

SHOW CREATE TABLE user_favorites;-- tofu
INSERT INTO family_recipes (
  recipe_id,
  title,
  originator,
  occasion,
  ingredients,
  instructions
) VALUES (
  'F999',
  'Sweet & Spicy Silan Tofu',
  'Lioz Shor',
  'Midweek Cravings',
  JSON_ARRAY(
    '1 block firm tofu, frozen, thawed and pressed',
    '2 tbsp tapioca starch',
    '1 tbsp silan (date syrup)',
    '1 garlic clove, minced',
    '1 tbsp soy sauce',
    '1 tsp sweet chili sauce',
    'Few drops lemon juice or rice vinegar'
  ),
  '1. Freeze and defrost tofu for maximum sponginess.\n2. Cut into cubes, coat with starch.\n3. Fry until golden and crisp.\n4. Mix sauce, pour over tofu and stir till sticky and shiny.'
);

-- Grandma Shoshana
INSERT INTO family_recipes (
  recipe_id,
  title,
  originator,
  occasion,
  ingredients,
  instructions
) VALUES (
  'F1000',
  'Vegan Friday Kubbeh',
  'Grandma Shoshana',
  'Friday family lunch',
  JSON_ARRAY(
    '1 cup bulgur, soaked for 30 min and drained',
    '1/2 cup semolina',
    '1 tbsp olive oil',
    'Salt and pepper to taste',
    '1 chopped onion',
    '1 cup chopped mushrooms',
    '1 tsp baharat spice',
    '1/2 tsp cinnamon'
  ),
  '1. Mix bulgur, semolina, oil, salt and pepper into a dough.\n2. Cook onion and mushrooms with spices for the filling.\n3. Form dough into balls, stuff with filling, and seal.\n4. Simmer gently in soup or bake.'
);

-- Uncle George
INSERT INTO family_recipes (
  recipe_id,
  title,
  originator,
  occasion,
  ingredients,
  instructions
) VALUES (
  'F1001',
  'Lentil Bolognese Pasta',
  'Uncle George',
  'Saturday night comfort food',
  JSON_ARRAY(
    '250g lentils, cooked',
    '1 chopped onion',
    '2 garlic cloves, minced',
    '1 grated carrot',
    '2 tbsp tomato paste',
    '1 can crushed tomatoes',
    '1 tsp oregano',
    'Salt and pepper',
    'Olive oil'
  ),
  '1. Sauté onion, garlic, and carrot in olive oil.\n2. Add tomato paste, then crushed tomatoes and spices.\n3. Stir in cooked lentils.\n4. Simmer for 15–20 minutes.\n5. Serve over pasta.'
);
