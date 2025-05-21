USE recipe_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS user_favorites;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS family_recipes;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Create users table
CREATE TABLE users (
  user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(100),
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  country VARCHAR(100),
  profilepic VARCHAR(255),
  email VARCHAR(255) UNIQUE
);

-- Create general recipes table
CREATE TABLE recipes (
  recipe_id VARCHAR(20) NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
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
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
);

-- Create family recipes table (inherits recipe_id from recipes)
CREATE TABLE family_recipes (
  recipe_id VARCHAR(20) NOT NULL PRIMARY KEY,
  originator VARCHAR(100),
  occasion VARCHAR(100),
  story TEXT,
  passed_down_by VARCHAR(100),
  original_note_image VARCHAR(255),
  name VARCHAR(255),
  img VARCHAR(255),
  time INT,
  popularity INT,
  isVegan TINYINT(1),
  isVegetarian TINYINT(1),
  isGlutenFree TINYINT(1),
  ingredients TEXT,
  instructions TEXT,
  description TEXT,
  releaseDate DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
);

INSERT INTO family_recipes (
  recipe_id,
  originator,
  occasion,
  story,
  passed_down_by,
  original_family,
  name,
  img,
  time,
  popularity,
  isVegan,
  isVegetarian,
  isGlutenFree,
  ingredients,
  instructions,
  description,
  release_date,
  created_at
) VALUES (
  'F999',
  'Lioz Shor',
  'Midweek Cravings',
  'Legend has it, this tofu once survived three freeze-thaw cycles to become the crispiest, most flavorful thing to ever touch a pan. Mom passed it down after a long night of watching MasterChef.',
  'Mom',
  'Middle Eastern Vegan Royalty',
  'Sweet & Spicy Silan Tofu',
  'https://example.com/images/lioz_tofu.jpg',
  20,
  95,
  1,
  1,
  1,
  JSON_ARRAY(
    '1 block firm tofu, frozen, thawed and pressed',
    '2 tbsp tapioca starch',
    '1 tbsp silan (date syrup)',
    '1 garlic clove, minced',
    '1 tbsp soy sauce',
    '1 tsp sweet chili sauce',
    'Few drops lemon juice or rice vinegar'
  ),
  '1. Freeze and defrost tofu for maximum sponginess.\n2. Cut into cubes, coat with starch.\n3. Fry until golden and crisp.\n4. Mix sauce, pour over tofu and stir till sticky and shiny.',
  'Crispy, sweet, tangy and slightly spicy — this dish is a perfect weeknight treat. It’s Lioz-approved, cruelty-free, and emotionally healing.',
  NOW(),
  NOW()
);
