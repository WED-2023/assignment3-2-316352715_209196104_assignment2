USE recipe_db;

-- Drop tables if they exist (in the correct order to avoid foreign key errors)
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL, 
    profile_pic TEXT,
    is_admin BOOLEAN DEFAULT FALSE
    
    );

-- Create recipes table
CREATE TABLE recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_family_recipe BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create favorites table
CREATE TABLE user_favorites (
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);


-- Create family_recipes table
CREATE TABLE family_recipes (
    recipe_id INT PRIMARY KEY,
    originator VARCHAR(100),         
    occasion VARCHAR(100),           
    story TEXT,                   
    passed_down_by VARCHAR(100),    
    original_note_image VARCHAR(255),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);
    
