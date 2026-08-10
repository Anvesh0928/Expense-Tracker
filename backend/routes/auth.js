const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendResetCode } = require('../utils/mailer');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate inputs
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'All fields are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ msg: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        await user.save();
        res.json({ msg: 'User registered successfully', userId: user._id, name: user.name });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid email or password.' });
        }

        res.json({ msg: 'Logged in successfully', userId: user._id, name: user.name });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Forgot Password – generate and email a reset code
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ msg: 'Email is required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Return error so the user knows the email is not registered
            return res.status(404).json({ msg: 'No account found with that email address.' });
        }

        // Generate a 6-digit numeric token
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetToken = token;
        user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await user.save();

        // Send email
        try {
            await sendResetCode(normalizedEmail, token);
        } catch (mailErr) {
            console.error('Mailer error:', mailErr.message);
            // Clear the token so it cannot be exploited if email failed
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await user.save();
            return res.status(500).json({ msg: mailErr.message.includes('not configured') ? mailErr.message : 'Failed to send reset email. Please try again later.' });
        }

        res.json({ msg: 'Reset code sent to your email. Check your inbox (and spam folder).' });
    } catch (err) {
        console.error('Forgot-password error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Reset Password – consume the token and set a new password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ msg: 'Email, reset code, and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.resetToken) {
            return res.status(400).json({ msg: 'Invalid reset code. Please request a new one.' });
        }
        if (user.resetToken !== token.trim()) {
            return res.status(400).json({ msg: 'Incorrect reset code.' });
        }
        if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await user.save();
            return res.status(400).json({ msg: 'Reset code has expired. Please request a new one.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        res.json({ msg: 'Password reset successfully. You can now sign in.' });
    } catch (err) {
        console.error('Reset-password error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
