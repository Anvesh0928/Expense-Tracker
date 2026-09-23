const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Expense = require('../models/Expense');
const requireUser = require('../utils/requireUser');

router.use(requireUser);

// GET /api/expenses
router.get('/', async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });
        return res.json(expenses);
    } catch (err) {
        console.error('Get expenses error:', err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

// POST /api/expenses
router.post('/', async (req, res) => {
    try {
        const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
        const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
        const amount = Number(req.body.amount);

        if (!title || !category || !Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ msg: 'Enter a valid title, category, and positive amount.' });
        }

        const newExpense = await Expense.create({
            userId: req.userId,
            title,
            amount,
            category
        });

        return res.status(201).json(newExpense);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: 'Please provide valid expense details.' });
        }
        console.error('Create expense error:', err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid expense ID.' });
        }

        const expense = await Expense.findOne({ _id: req.params.id, userId: req.userId });
        if (!expense) {
            return res.status(404).json({ msg: 'Expense not found.' });
        }

        await expense.deleteOne();
        return res.json({ msg: 'Expense removed' });
    } catch (err) {
        console.error('Delete expense error:', err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
