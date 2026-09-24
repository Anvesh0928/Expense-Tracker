const { app, connectDatabase } = require('../backend/server');

let databaseConnection;

module.exports = async (req, res) => {
    try {
        if (!databaseConnection) {
            databaseConnection = connectDatabase();
        }

        await databaseConnection;
        return app(req, res);
    } catch (error) {
        console.error('Vercel startup error:', error.message);
        return res.status(500).json({
            msg: 'Server configuration or database connection failed.'
        });
    }
};
