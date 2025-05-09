const jwt = require('jsonwebtoken');
const { db } = require('../connection/db');
require('dotenv')

exports.protect = async (req, res, next) => {
    let token;
    console.log(req.headers.authorization)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    console.log(token)

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, "process.env.SECRET_KEY");

        // Get user from database
        const user = db.prepare("SELECT * FROM staff WHERE id = ?").get(decoded.id);
        console.log(decoded, user)

        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        req.user = {...decoded, ...user};
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Not authorized, try login' });
    }
};

// Admin middleware
exports.IsAdmin = (req, res, next) => {
    if (req.user && req.user.role === "Administrator") {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};