import { ref, Ref } from 'vue';
import { fetchRecipeList, fetchRecipeDetail, RecipeListItem, RecipeDetail } from './RecipeService';
import isEqual from 'lodash/isEqual';
import reduce from 'lodash/reduce';
import axios from 'axios';

const LOG_FIELDS = ['name', 'ingredients', 'directions', 'description', 'notes', 'source'];

export function useRecipePoller(interval: number = 30000) {
  const recipeHashes: Ref<Record<string, string>> = ref({});
  const recipes: Ref<Record<string, RecipeDetail>> = ref({});
  const logs: Ref<any[]> = ref([]);
  const email: Ref<string> = ref('skesler@outlook.com');
  const password: Ref<string> = ref('lucy*inherit0saddle');
  const polling: Ref<boolean> = ref(false);
  const lastSuccess: Ref<Date | null> = ref(null);
  const error: Ref<string | null> = ref(null);
  let timer: ReturnType<typeof setInterval> | null = null;
  let initialized = false;

  async function loadCachedRecipes() {
    try {
      const response = await axios.get('http://localhost:3001/api/cached-recipes');
      const cached: RecipeDetail[] = response.data;
      for (const recipe of cached) {
        recipes.value[recipe.uid] = recipe;
        recipeHashes.value[recipe.uid] = recipe.hash;
      }
    } catch (e: any) {
      // Ignore errors, just start with empty cache
    }
  }

  const poll = async () => {
    if (!email.value || !password.value) return;
    if (!initialized) {
      await loadCachedRecipes();
      initialized = true;
    }
    polling.value = true;
    error.value = null;
    try {
      const list: RecipeListItem[] = await fetchRecipeList(email.value, password.value);
      const newHashes: Record<string, string> = {};
      for (const { uid, hash } of list) {
        newHashes[uid] = hash;
        if (recipeHashes.value[uid] !== hash) {
          // New or changed recipe
          const newRecipe: RecipeDetail = await fetchRecipeDetail(uid, email.value, password.value);
          const oldRecipe = recipes.value[uid];
          if (oldRecipe) {
            const diff = getDiff(oldRecipe, newRecipe);
            logs.value.push({ timestamp: new Date(), uid, diff });
            // Log to server if relevant fields changed
            const filteredDiff = Object.fromEntries(
              LOG_FIELDS.filter(field => diff[field]).map(field => [field, diff[field]])
            );
            console.log('Full diff:', diff);
            console.log('Filtered diff:', filteredDiff);
            console.log('LOG_FIELDS:', LOG_FIELDS);
            if (Object.keys(filteredDiff).length > 0) {
              await axios.post('http://localhost:3001/api/log-recipe-change', {
                name: newRecipe.name,
                diff: filteredDiff
              });
            }
          } else {
            logs.value.push({ timestamp: new Date(), uid, diff: 'New recipe added' });
          }
          recipes.value[uid] = newRecipe;
        }
      }
      // Detect deleted recipes
      for (const uid in recipeHashes.value) {
        if (!(uid in newHashes)) {
          logs.value.push({ timestamp: new Date(), uid, diff: 'Recipe deleted' });
        }
      }
      recipeHashes.value = newHashes;
      lastSuccess.value = new Date();
    } catch (e: any) {
      error.value = e.message || 'Unknown error';
    } finally {
      polling.value = false;
    }
  };

  const start = () => {
    poll();
    timer = setInterval(poll, interval);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
  };

  return { recipes, logs, start, stop, email, password, polling, lastSuccess, error };
}

function getDiff(oldRecipe: RecipeDetail, newRecipe: RecipeDetail): Record<string, any> {
  return reduce(newRecipe, (result: Record<string, any>, value, key) => {
    if (!isEqual(value, (oldRecipe as any)[key])) {
      result[key] = { old: (oldRecipe as any)[key], new: value };
    }
    return result;
  }, {});
} 