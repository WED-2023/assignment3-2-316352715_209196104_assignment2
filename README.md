Rom Sheynis - 209196104
Lioz Shor - 316352715



# Recipe Website API

This API is part of a web app where users can sign up, log in, view recipes, and save their favorites. There’s also support for managing users and recipes, including admin-level access to create new recipes.

## Base URLs

- Production (mock server):  
  `https://virtserver.swaggerhub.com/bgu-2f9/RecipesAPI/1.0.0`
- Local development:  
  `http://localhost:3000`

## Features

- User registration, login, and logout
- View all recipes or search by filters
- Add new recipes (admin only)
- Mark recipes as favorites
- View user info and their recipes

---

## Endpoints

### Auth

- `POST /auth/register` – register a new user  
- `POST /auth/login` – log in with username and password  
- `POST /auth/logout` – log out current session  

### Recipes

- `GET /recipes` – get all recipes (with filters like `limit`, `skip`, `recipeType`)  
- `POST /recipes` – add a recipe (admin only)  
- `GET /recipes/{id}` – get a specific recipe by its ID  

### Users

- `GET /users` – list all users  
- `GET /users/{id}` – get user details by ID  

---

## Data Models

### Recipe

```json
{
  "id": "uuid",
  "name": "Pasta Marinara",
  "img": "https://link.to/image.jpg",
  "time": 45,
  "releaseDate": "2024-01-01T00:00:00Z",
  "popularity": 4.5,
  "isVegan": true,
  "isVegetarian": true,
  "isGlutenFree": false
}
```

### User

```json
{
  "id": "uuid",
  "username": "shraga",
  "email": "dror@example.com",
  "password": "Pa$$12",
  "firstname": "moshi",
  "lastname": "shori",
  "country": "Israel",
  "isAdmin": false,
  "favorites": [101, 102],
  "myRecipes": [201, 202],
  "myFamilyRecipes": [301],
  "viewedRecpies": [301, 302]
}
```

---

## How to Test

Use [Postman](https://www.postman.com/) or any HTTP client to send requests. Example:

**Register a user:**

```http
POST /auth/register
Content-Type: application/json

{
  "username": "shraga",
  "firstname": "moshi",
  "lastname": "shori",
  "country": "Israel",
  "email": "dror@example.com",
  "password": "Pa$$12"
}
```

---

## Notes

- Make sure to send cookies if you're testing session-based routes (like `/logout`).
- The database includes `users`, `recipes`, and `favorites` tables. Foreign keys are enforced.
- Password rules: 5–10 characters, at least one number and one special character.


