import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const RECIPES_FILE = path.join(process.cwd(), 'recipes.json');

function readRecipesFile() {
  try {
    if (!fs.existsSync(RECIPES_FILE)) return {};
    return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function writeRecipesFile(data) {
  fs.writeFileSync(RECIPES_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/recipes', async (req, res) => {
  const { email, password } = req.query;
  const auth = Buffer.from(`${email}:${password}`).toString('base64');
  try {
    const response = await axios.get(
      'https://www.paprikaapp.com/api/v1/sync/recipes/',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all cached recipes
app.get('/api/cached-recipes', (req, res) => {
  const recipes = readRecipesFile();
  res.json(Object.values(recipes));
});

app.get('/api/recipe/:uid', async (req, res) => {
  const { email, password } = req.query;
  const { uid } = req.params;
  const recipes = readRecipesFile();
  if (recipes[uid]) {
    return res.json({ result: recipes[uid] });
  }
  const auth = Buffer.from(`${email}:${password}`).toString('base64');
  try {
    const response = await axios.get(
      `https://www.paprikaapp.com/api/v1/sync/recipe/${uid}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    // Cache the recipe
    recipes[uid] = response.data.result;
    writeRecipesFile(recipes);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log recipe changes to a local text file
app.post('/api/log-recipe-change', (req, res) => {
  const { name, diff } = req.body;
  console.log('Server received:', { name, diff });
  const timestamp = new Date().toString();
  const fields = ['name', 'ingredients', 'directions', 'description', 'notes', 'source'];
  let logEntry = `\n[${timestamp}] Recipe Change: ${name}\n`;
  let hasChange = false;
  for (const field of fields) {
    if (diff && diff[field]) {
      hasChange = true;
      logEntry += `  ${field}:\n    BEFORE: ${diff[field].old}\n    AFTER:  ${diff[field].new}\n`;
    }
  }
  console.log('Log entry:', logEntry);
  console.log('Has change:', hasChange);
  if (hasChange) {
    fs.appendFileSync('recipe_changes.log', logEntry);
  }
  res.json({ success: true });
});

app.listen(3001, () => console.log('Proxy server running on port 3001')); 