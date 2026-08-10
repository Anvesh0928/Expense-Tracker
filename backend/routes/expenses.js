const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Check that a user-id header was sent
const checkAuth = (req, res, next) => {
    const userId = req.headers['user-id'];
    if (!userId) return res.status(401).json({ msg: 'No User ID, authorization denied' });
    req.userId = userId;
    next();
};

// GET /api/expenses
router.get('/', checkAuth, async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// POST /api/expenses
router.post('/', checkAuth, async (req, res) => {
    try {
        const { title, amount, category } = req.body;
        const newExpense = new Expense({ userId: req.userId, title, amount, category });
        const expense = await newExpense.save();
        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', checkAuth, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });

        if (expense.userId.toString() !== req.userId) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Expense.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Expense removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
