const { db } = require('../connection/db.js');

// Test Operations
exports.testOperations = {
    getAll: (categoryId = null) => {
        let query = 'SELECT t.*, tc.name as category_name FROM tests t JOIN test_categories tc ON t.category_id = tc.id';
        if (categoryId) {
            query += ' WHERE t.category_id = ?';
            return db.prepare(query).all(categoryId);
        }
        return db.prepare(query).all();
    },
};
