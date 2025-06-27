import axios from 'axios';

export interface RecipeListItem {
  uid: string;
  hash: string;
}

export interface RecipeDetail {
  uid: string;
  name: string;
  ingredients: string;
  directions: string;
  description: string;
  notes: string;
  nutritional_info: string;
  servings: string;
  difficulty: string;
  prep_time: string;
  cook_time: string;
  total_time: string;
  source: string;
  source_url: string;
  image_url: string;
  photo: string;
  photo_hash: string;
  photo_large: string | null;
  scale: string | null;
  hash: string;
  categories: string[];
  rating: number;
  in_trash: boolean;
  is_pinned: boolean;
  on_favorites: boolean;
  on_grocery_list: boolean;
  created: string;
  photo_url: string;
}

export async function fetchRecipeList(email: string, password: string): Promise<RecipeListItem[]> {
  const response = await axios.get(
    'http://localhost:3001/api/recipes',
    { params: { email, password } }
  );
  return response.data.result;
}

export async function fetchRecipeDetail(uid: string, email: string, password: string): Promise<RecipeDetail> {
  const response = await axios.get(
    `http://localhost:3001/api/recipe/${uid}`,
    { params: { email, password } }
  );
  return response.data.result;
} 