const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// Serve the app folder securely via Express
app.use(express.static(path.join(__dirname, 'app')));

// Using users.json for simple persistent storage
const usersFile = path.join(__dirname, 'users.json');

// Initialize users.json if it doesn't exist
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

function getUsers() {
    const data = fs.readFileSync(usersFile);
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// POST /api/signup endpoint
app.post('/api/signup', (req, res) => {
    const { fullName, email, username, password } = req.body;
    
    if (!fullName || !email || !username || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const users = getUsers();
    
    const userExists = users.some(u => u.username === username || u.email === email);
    if (userExists) {
        return res.status(400).json({ error: 'Username or email already exists!' });
    }

    const newUser = { fullName, email, username, password };
    users.push(newUser);
    saveUsers(users);

    res.status(201).json({ message: 'User registered successfully!' });
});

// POST /api/login endpoint
app.post('/api/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Both fields are required.' });
    }

    const users = getUsers();
    
    const user = users.find(u => 
        (u.username === usernameOrEmail || u.email === usernameOrEmail) && 
        u.password === password
    );

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. Please register first.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ message: 'Login successful!', user: userWithoutPassword });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
