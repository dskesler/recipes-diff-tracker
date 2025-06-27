import { ref } from 'vue';
import { fetchRecipeList, fetchRecipeDetail } from './RecipeService';
import _ from 'lodash';

export function useRecipePoller(interval = 10000) {
  const recipeHashes = ref({}); // { uid: hash }
  const recipes = ref({});      // { uid: recipeDetail }
  const logs = ref([]);
  const email = ref('skesler@outlook.com');
  const password = ref('lucy*inherit0saddle');
  const polling = ref(false);
  const lastSuccess = ref(null);
  const error = ref(null);
  let timer = null;

  const poll = async () => {
    if (!email.value || !password.value) return;
    polling.value = true;
    error.value = null;
    try {
      const list = await fetchRecipeList(email.value, password.value);
      const newHashes = {};
      for (const { uid, hash } of list) {
        newHashes[uid] = hash;
        if (recipeHashes.value[uid] !== hash) {
          // New or changed recipe
          const newRecipe = await fetchRecipeDetail(uid, email.value, password.value);
          const oldRecipe = recipes.value[uid];
          if (oldRecipe) {
            const diff = getDiff(oldRecipe, newRecipe);
            logs.value.push({ timestamp: new Date(), uid, diff });
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
          delete recipes.value[uid];
        }
      }
      recipeHashes.value = newHashes;
      lastSuccess.value = new Date();
    } catch (e) {
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
    clearInterval(timer);
  };

  return { recipes, logs, start, stop, email, password, polling, lastSuccess, error };
}

function getDiff(oldRecipe, newRecipe) {
  // Use lodash or a diff library for deep diffs
  return _.reduce(newRecipe, (result, value, key) => {
    if (!_.isEqual(value, oldRecipe[key])) {
      result[key] = { old: oldRecipe[key], new: value };
    }
    return result;
  }, {});
} 