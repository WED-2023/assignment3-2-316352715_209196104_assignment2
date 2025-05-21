USE recipe_db;

-- Drop tables if they exist (drop dependencies first)
DROP TABLE IF EXISTS user_favorites;
DROP TABLE IF EXISTS family_recipes;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS users;

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