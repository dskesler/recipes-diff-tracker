import axios from 'axios';

export async function fetchRecipeList(email, password) {
  const response = await axios.get(
    'http://localhost:3001/api/recipes',
    { params: { email, password } }
  );
  return response.data.result; // Array of { uid, hash }
}

export async function fetchRecipeDetail(uid, email, password) {
  const response = await axios.get(
    `http://localhost:3001/api/recipe/${uid}`,
    { params: { email, password } }
  );
  return response.data.result; // Full recipe object
} 