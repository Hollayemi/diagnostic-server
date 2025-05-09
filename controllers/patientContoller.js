const { db } = require('../connection/db.js');
const { saveBase64Image } = require('../utility/saveBase64Image.js');
const bigPromise = require("../middlewares/bigPromise");
const CustomError = require('../utility/customError.js');

// Patients Operations
exports.getAll = bigPromise(async (req, res, next) => {
    try {
        const { search = '', filters = {} } = req.body;
        let query = 'SELECT * FROM patients WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (filters.gender && filters.gender !== 'all') {
            query += ' AND gender = ?';
            params.push(filters.gender);
        }

        query += ' ORDER BY name ASC';
        return res.status(200).json({ type: "success", data: db.prepare(query).all(...params) });
    } catch (error) {
        return next(new CustomError(error, 500));
    }
});

exports.getById = bigPromise(async (req, res, next) => {
    try {
        return res.status(200).json({ type: "success", data: db.prepare('SELECT * FROM patients WHERE id = ?').get(req.query.id) });
    } catch (error) {
        return next(new CustomError(error, 500));
    }
})

exports.create = bigPromise(async (req, res, next) => {
    try {
        const patient = req.body;
        const { name, age, gender, phone, blood_group, address, image } = patient;
        console.log(name, age, gender, phone, blood_group, address);

        // if (!name || !age || gender || !phone || !blood_group || !address || !image) {
        //     return next(new CustomError("Please provide all the required fields", 400));
        // }

        let image_path;
        try {
            image_path = saveBase64Image(image, name, age); // Local path
        } catch (error) {
            return next(new CustomError("Image processing failed: " + error.message, 500));
        }

        const { lastInsertRowid } = db.prepare(`
            INSERT INTO patients (name, age, gender, phone, blood_group, address, image_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(name, age, gender, phone, blood_group, address, image_path);

        return res.status(201).json({ type: "success", data: lastInsertRowid, message: "Patient created successfully" });

    } catch (error) {
        return next(new CustomError(error, 500));
    }
})

exports.update = bigPromise(async (req, res, next) => {
    try {
        const { id, patient } = req.body;
        db.prepare(`
      UPDATE patients 
      SET name = ?, age = ?, gender = ?, phone = ?, email = ?, address = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
            patient.name,
            patient.age,
            patient.gender,
            patient.phone,
            patient.email,
            patient.address,
            patient.image_path,
            id
        );

        return res.status(200).json({
            type: "success",
            message: "Patient updated successfully",
        })
    } catch (error) {
        return next(new CustomError(error, 500));
    }
})

exports.delete = bigPromise(async (req, res, next) => {
    try {
        const { id } = req.query
        db.prepare('DELETE FROM patients WHERE id = ?').run(id);
        return res.status(200).json({
            type: "success",
            message: "Patient deleted successfully",
        })
    } catch (error) {
        return next(new CustomError(error, 500));
    }
})
