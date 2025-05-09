const express = require('express');
const router = express.Router();
const { db } = require("../connection/db");
const { protect } = require('../middlewares/AuthVerifyMiddleware');

router.get('/all', protect, (req, res) => {
    const groups = db.prepare('SELECT * FROM groups').all();
    const testsByGroup = groups.map(group => {
        const tests = db.prepare('SELECT * FROM tests WHERE group_id = ?').all(group.id);
        return {
            id: group.id,
            name: group.name,
            tests: tests.map(t => t)
        };
    });
    res.json(testsByGroup);
});

module.exports = router;
