const { db } = require('../database/initDB');
const CustomError = require('../utils/CustomError');
const bigPromise = require('../utils/bigPromise');

exports.create = bigPromise(async (req, res, next) => {
    try {
        const staff = req.body;
        const { name, role, email, phone, status } = staff;

        if (!name || !role || !email) {
            return next(new CustomError("Name, role and email are required", 400));
        }

        const { lastInsertRowid } = db.prepare(`
            INSERT INTO staff (name, role, email, phone, status)
            VALUES (?, ?, ?, ?, ?)
        `).run(name, role, email, phone, status || 'active');

        return res.status(201).json({
            type: "success",
            data: { id: lastInsertRowid },
            message: "Staff member created successfully"
        });

    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return next(new CustomError("Email already exists", 400));
        }
        return next(new CustomError(error.message, 500));
    }
});

exports.getAll = bigPromise(async (req, res, next) => {
    try {
        const { search = '', role = 'all', status = 'all' } = req.query;

        let query = 'SELECT * FROM staff WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (role !== 'all') {
            query += ' AND role = ?';
            params.push(role);
        }

        if (status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY name ASC';
        const staffMembers = db.prepare(query).all(...params);

        return res.status(200).json({
            type: "success",
            data: staffMembers,
            message: "Staff members retrieved successfully"
        });

    } catch (error) {
        return next(new CustomError(error.message, 500));
    }
});

exports.getOne = bigPromise(async (req, res, next) => {
    try {
        const { id } = req.params;

        const staff = db.prepare('SELECT * FROM staff WHERE id = ?').get(id);

        if (!staff) {
            return next(new CustomError("Staff member not found", 404));
        }

        return res.status(200).json({
            type: "success",
            data: staff,
            message: "Staff member retrieved successfully"
        });

    } catch (error) {
        return next(new CustomError(error.message, 500));
    }
});

exports.update = bigPromise(async (req, res, next) => {
    try {
        const { id } = req.params;
        const staff = req.body;
        const { name, role, email, phone, status } = staff;

        // Check if staff exists
        const existingStaff = db.prepare('SELECT id FROM staff WHERE id = ?').get(id);
        if (!existingStaff) {
            return next(new CustomError("Staff member not found", 404));
        }

        db.prepare(`
            UPDATE staff 
            SET name = ?, role = ?, email = ?, phone = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name, role, email, phone, status, id);

        return res.status(200).json({
            type: "success",
            data: { id },
            message: "Staff member updated successfully"
        });

    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return next(new CustomError("Email already exists", 400));
        }
        return next(new CustomError(error.message, 500));
    }
});

exports.delete = bigPromise(async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if staff exists
        const existingStaff = db.prepare('SELECT id FROM staff WHERE id = ?').get(id);
        if (!existingStaff) {
            return next(new CustomError("Staff member not found", 404));
        }

        // Check if staff is assigned to any orders
        const assignedOrders = db.prepare(`
            SELECT COUNT(*) as count FROM orders WHERE staff_id = ?
        `).get(id);

        if (assignedOrders.count > 0) {
            return next(new CustomError("Cannot delete staff member assigned to orders", 400));
        }

        db.prepare('DELETE FROM staff WHERE id = ?').run(id);

        return res.status(200).json({
            type: "success",
            data: null,
            message: "Staff member deleted successfully"
        });

    } catch (error) {
        return next(new CustomError(error.message, 500));
    }
});

exports.deactivate = bigPromise(async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if staff exists
        const existingStaff = db.prepare('SELECT id, status FROM staff WHERE id = ?').get(id);
        if (!existingStaff) {
            return next(new CustomError("Staff member not found", 404));
        }

        const newStatus = existingStaff.status === 'active' ? 'inactive' : 'active';

        db.prepare(`
            UPDATE staff 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(newStatus, id);

        return res.status(200).json({
            type: "success",
            data: { id, status: newStatus },
            message: `Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        return next(new CustomError(error.message, 500));
    }
});