const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Task = require('../models/Task');
const requireUser = require('../utils/requireUser');

router.use(requireUser);

// GET /api/tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
        return res.json(tasks);
    } catch (err) {
        console.error('Get tasks error:', err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

// POST /api/tasks
router.post('/', async (req, res) => {
    try {
        const taskName = typeof req.body.taskName === 'string' ? req.body.taskName.trim() : '';

        if (!taskName) {
            return res.status(400).json({ msg: 'Task name is required.' });
        }

        const task = await Task.create({
            userId: req.userId,
            taskName
        });

        return res.status(201).json(task);
    } catch (err) {
        console.error('Create task error:', err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

// PUT /api/tasks/:id — update status
router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid task ID.' });
        }

        const { status } = req.body;
        if (!['pending', 'completed'].includes(status)) {
            return res.status(400).json({ msg: 'Status must be pending or completed.' });
        }

        const updated = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: { status } },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ msg: 'Task not found.' });
        }

        return res.json(updated);
    } catch (err) {
        console.error('Update task error:', err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid task ID.' });
        }

        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!task) {
            return res.status(404).json({ msg: 'Task not found.' });
        }

        return res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error('Delete task error:', err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
