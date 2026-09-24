const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ msg: 'API route not found.' });
    }
    next();
});

async function connectDatabase() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not configured.');
    }

    if (mongoose.connection.readyState === 1) {
        return;
    }

    await mongoose.connect(process.env.MONGO_URI);
}

async function startServer() {
    try {
        await connectDatabase();
        console.log('MongoDB Connected...');

        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exitCode = 1;
    }
}

module.exports = { app, connectDatabase };

if (require.main === module) {
    startServer();
}
