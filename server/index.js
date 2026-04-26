require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { initDb } = require('./db');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

let db;

app.get('/api/needs', async (req, res) => {
    try {
        const needs = await db.all('SELECT * FROM needs ORDER BY created_at DESC');
        res.json(needs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/needs', async (req, res) => {
    const { title, description, location, lat, lng, urgency, category } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO needs (title, description, location, lat, lng, urgency, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, location, lat, lng, urgency, category]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/volunteers', async (req, res) => {
    try {
        const volunteers = await db.all('SELECT * FROM volunteers');
        res.json(volunteers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/volunteers', async (req, res) => {
    const { name, skills, location, lat, lng, availability, contact } = req.body;
    try {
        const result = await db.run(
            'INSERT INTO volunteers (name, skills, location, lat, lng, availability, contact) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, skills, location, lat, lng, availability, contact]
        );
        res.json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dynamic parameter-based matching for a specific need
app.get('/api/match/:needId', async (req, res) => {
    try {
        const need = await db.get('SELECT * FROM needs WHERE id = ?', [req.params.needId]);
        const volunteers = await db.all('SELECT * FROM volunteers');

        if (!need || volunteers.length === 0) {
            return res.status(404).json({ error: 'Need not found or no volunteers available' });
        }

        let rankedVolunteers = [];

        if (apiKey && apiKey.length > 10) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const systemInstruction = `You are a dynamic Resource Allocation Engine. Rank the provided volunteers for the specific need based on: 1) Skill match, 2) Location proximity, 3) Availability. 
                Return a JSON array of objects: [{ "volunteer_id": number, "score": number (0-100), "reasoning": "string breakdown" }]`;
                
                const userPrompt = `Need: ${JSON.stringify(need)}\nVolunteers: ${JSON.stringify(volunteers)}`;
                const combinedPrompt = `${systemInstruction}\n\n${userPrompt}`;

                const result = await model.generateContent(combinedPrompt);
                const response = await result.response;
                let text = response.text().trim();
                if (text.startsWith('```')) text = text.replace(/```json|```/g, '').trim();
                
                rankedVolunteers = JSON.parse(text);
                
                // Map full volunteer details
                rankedVolunteers = rankedVolunteers.map(rv => {
                    const vol = volunteers.find(v => v.id === rv.volunteer_id);
                    return { ...vol, match_score: rv.score, ai_reasoning: rv.reasoning };
                }).sort((a, b) => b.match_score - a.match_score);

            } catch (aiErr) {
                console.warn('AI Dynamic Matching failed, falling back:', aiErr.message);
            }
        }

        // Heuristic fallback ranking if AI fails
        if (rankedVolunteers.length === 0) {
            rankedVolunteers = volunteers.map(v => {
                let score = 50; // Base score
                const needDesc = need.description.toLowerCase();
                const needCat = need.category.toLowerCase();
                
                // Skill match heuristic
                const skills = v.skills.toLowerCase().split(',');
                const skillMatch = skills.some(s => needDesc.includes(s.trim()) || needCat.includes(s.trim()));
                if (skillMatch) score += 30;

                // Location heuristic (simple string match for prototype)
                if (v.location === need.location) score += 20;

                return {
                    ...v,
                    match_score: score,
                    ai_reasoning: `Score based on parameter heuristics. Skill match: ${skillMatch ? 'High' : 'Low'}, Location: ${v.location === need.location ? 'Exact' : 'Different'}`
                };
            }).sort((a, b) => b.match_score - a.match_score);
        }

        res.json(rankedVolunteers);
    } catch (err) {
        console.error('Match error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Execute the allocation
app.post('/api/allocate', async (req, res) => {
    const { need_id, volunteer_id, ai_reasoning, match_score } = req.body;
    try {
        await db.run(
            'INSERT INTO matches (need_id, volunteer_id, ai_reasoning, match_score) VALUES (?, ?, ?, ?)',
            [need_id, volunteer_id, ai_reasoning, match_score]
        );
        await db.run('UPDATE needs SET status = "assigned" WHERE id = ?', [need_id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

initDb().then(database => {
    db = database;
    console.log('Database initialized');
}).catch(err => {
    console.error('Database failed to initialize:', err);
});
