import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

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

app.get('/api/recipe/:uid', async (req, res) => {
  const { email, password } = req.query;
  const { uid } = req.params;
  const auth = Buffer.from(`${email}:${password}`).toString('base64');
  try {
    const response = await axios.get(
      `https://www.paprikaapp.com/api/v1/sync/recipe/${uid}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log recipe changes to a local text file
app.post('/api/log-recipe-change', (req, res) => {
  const { name, diff } = req.body;
  const timestamp = new Date().toISOString();
  const fields = ['name', 'ingredients', 'directions', 'description', 'notes', 'source'];
  let logEntry = `\n[${timestamp}] Recipe Change: ${name}\n`;
  for (const field of fields) {
    if (diff[field]) {
      logEntry += `  ${field}:\n    BEFORE: ${diff[field].old}\n    AFTER:  ${diff[field].new}\n`;
    }
  }
  fs.appendFileSync('recipe_changes.log', logEntry);
  res.json({ success: true });
});

app.listen(3001, () => console.log('Proxy server running on port 3001')); 