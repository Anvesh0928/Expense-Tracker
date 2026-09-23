const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Validates the user-id header before protected data operations.
 * Note: this keeps the current client-side user-id flow intact;
 * signed/session-based authentication should be added before production use.
 */
async function requireUser(req, res, next) {
    const userId = req.headers['user-id'];

    if (!userId || !mongoose.isValidObjectId(userId)) {
        return res.status(401).json({ msg: 'A valid user ID is required.' });
    }

    try {
        const userExists = await User.exists({ _id: userId });
        if (!userExists) {
            return res.status(401).json({ msg: 'User not found. Please sign in again.' });
        }

        req.userId = userId;
        next();
    } catch (error) {
        console.error('User validation error:', error.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
}

module.exports = requireUser;
