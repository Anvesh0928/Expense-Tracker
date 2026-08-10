const nodemailer = require('nodemailer');

function createTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_gmail_app_password_here') {
        throw new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in your .env file.');
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

async function sendResetCode(toEmail, code) {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Smart Tracker" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Your Smart Tracker Password Reset Code',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; background: #f9f9f9; border-radius: 10px; padding: 32px; border: 1px solid #e0e0e0;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">🔐 Password Reset</h2>
            <p style="color: #555; font-size: 15px;">Use the code below to reset your Smart Tracker password. It expires in <strong>15 minutes</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #4361ee; background: #eef0ff; padding: 16px 24px; border-radius: 8px; display: inline-block;">${code}</span>
            </div>
            <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
}

module.exports = { sendResetCode };
