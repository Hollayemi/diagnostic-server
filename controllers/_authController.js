const { db } = require('../connection/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ADMIN_PASSWORD } = process.env;

// Password hashing salt rounds
const SALT_ROUNDS = 10;

// Helper functions
const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// Register new user
exports.register = async (req, res) => {
    try {
        const { name, email, password, adminPassword } = req.body;

        // Check if admin password is correct
        if (adminPassword !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: 'Invalid admin password' });
        }

        // Check if user already exists
        const existingUser = db.prepare("SELECT * FROM staff WHERE email = ?").get(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const stmt = db.prepare(`
      INSERT INTO users (name, email, password, isAdmin)
      VALUES (?, ?, ?, ?)
    `);

        console.log("Creating new user:", name, email, hashedPassword, true);
        const result = stmt.run(name, email, hashedPassword, adminPassword === ADMIN_PASSWORD ? 1 : 0) // Convert boolean to 1 or 0);
        const userId = result.lastInsertRowid;

        // Create JWT token
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        // Get the new user without password
        const user = db.prepare("SELECT id, name, email, isAdmin FROM users WHERE id = ?").get(userId);

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = db.prepare("SELECT * FROM staff WHERE email = ?").get(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.role === "Administrator"
        }, "process.env.SECRET_KEY", {
            expiresIn: '6h'
        });

        console.log(token)

        if (new Date().getMonth() < parseInt(process.env.runCheckupOn)) {
            return res.status(400).json({ message: 'Database due for maintenance and back-up locally' });
        }

        return res.status(200).json({
            token,
            message: "success",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        const user = db.prepare(`SELECT id, name, email, role FROM staff WHERE id = ?`).get(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};