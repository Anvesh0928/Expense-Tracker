const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Check that a user-id header was sent
const checkAuth = (req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ msg: 'No User ID, authorization denied' });
    req.userId = userId;
    next();
};

// GET /api/tasks
router.get('/', checkAuth, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// POST /api/tasks
router.post('/', checkAuth, async (req, res) => {
    try {
        const { taskName } = req.body;
        const newTask = new Task({ userId: req.userId, taskName });
        const task = await newTask.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// PUT /api/tasks/:id — toggle status
router.put('/:id', checkAuth, async (req, res) => {
    try {
        const { status } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        if (task.userId.toString() !== req.userId) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const updated = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', checkAuth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        if (task.userId.toString() !== req.userId) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
