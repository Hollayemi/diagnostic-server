const { db } = require('../connection/db.js');
const CustomError = require('../utility/customError');
const bigPromise = require('../middlewares/bigPromise');
const { generateInvoiceNumber } = require('../utility/helper');

exports.createOrder = bigPromise(async (req, res, next) => {
    try {
        const { patient_id, tests, notes = '' } = req.body;
        const staff_id = req.user.id;

        // Validate required fields
        if (!patient_id || !tests || !Array.isArray(tests) || tests.length === 0) {
            return next(new CustomError('Patient ID and tests array are required', 400));
        }

        // Verify patient exists
        const patient = db.prepare('SELECT id FROM patients WHERE id = ?').get(patient_id);
        if (!patient) {
            return next(new CustomError('Patient not found', 404));
        }

        // Start transaction
        db.exec('BEGIN TRANSACTION');

        try {
            // 1. Create the order
            const { lastInsertRowid: orderId } = db.prepare(`
        INSERT INTO orders (patient_id, staff_id, notes)
        VALUES (?, ?, ?)
      `).run(patient_id, staff_id, notes);

            // 2. Add tests to order
            const insertTest = db.prepare(`
        INSERT INTO order_tests (order_id, test_id)
        VALUES (?, ?)
      `);

            const testPrices = [];
            for (const testId of tests) {
                // Verify test exists and get price
                const test = db.prepare('SELECT id, price FROM tests WHERE id = ?').get(testId);
                if (!test) {
                    throw new CustomError(`Test with ID ${testId} not found`, 404);
                }

                insertTest.run(orderId, testId);
                testPrices.push(test.price);
            }

            // 3. Calculate total amount
            const subtotal = testPrices.reduce((sum, price) => sum + price, 0);

            // 4. Create invoice
            const invoice_number = generateInvoiceNumber();
            const due_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            const { lastInsertRowid: invoiceId } = db.prepare(`
        INSERT INTO invoices (
          order_id,
          invoice_number,
          due_date,
          total_amount
        ) VALUES (?, ?, ?, ?)
      `).run(orderId, invoice_number, due_date, subtotal);

            // Commit transaction
            db.exec('COMMIT');

            return res.status(201).json({
                type: "success",
                data: {
                    order_id: orderId,
                    invoice_id: invoiceId,
                    invoice_number,
                    total_amount: subtotal
                },
                message: "Order created successfully"
            });

        } catch (error) {
            // Rollback on error
            db.exec('ROLLBACK');
            throw error;
        }

    } catch (error) {
        return next(new CustomError(error.message, error.statusCode || 500));
    }
});

exports.getOrderDetails = bigPromise(async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get order basic info
        const order = db.prepare(`
      SELECT o.*, p.name as patient_name, p.phone as patient_phone,
             s.name as staff_name, s.role as staff_role
      FROM orders o
      JOIN patients p ON o.patient_id = p.id
      JOIN staff s ON o.staff_id = s.id
      WHERE o.id = ?
    `).get(id);

        if (!order) {
            return next(new CustomError('Order not found', 404));
        }

        // Get tests for this order
        order.tests = db.prepare(`
      SELECT t.id, t.name, t.price, ot.status
      FROM order_tests ot
      JOIN tests t ON ot.test_id = t.id
      WHERE ot.order_id = ?
    `).all(id);

        // Get associated invoice if exists
        order.invoice = db.prepare(`
      SELECT id, invoice_number, status, total_amount
      FROM invoices
      WHERE order_id = ?
      LIMIT 1
    `).get(id);

        return res.status(200).json({
            type: "success",
            data: order,
            message: "Order details retrieved successfully"
        });

    } catch (error) {
        return next(new CustomError(error.message, 500));
    }
});

exports.updateOrderStatus = bigPromise(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, test_updates } = req.body;

        // Validate status
        const validStatuses = ['pending', 'in-progress', 'completed'];
        if (status && !validStatuses.includes(status)) {
            return next(new CustomError('Invalid status value', 400));
        }

        // Start transaction
        db.exec('BEGIN TRANSACTION');

        try {
            // Update order status if provided
            if (status) {
                db.prepare(`
          UPDATE orders 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(status, id);
            }

            // Update individual test statuses if provided
            if (test_updates && Array.isArray(test_updates)) {
                const updateTest = db.prepare(`
          UPDATE order_tests
          SET status = ?, completed_at = ?, assigned_to = ?
          WHERE order_id = ? AND test_id = ?
        `);

                for (const update of test_updates) {
                    updateTest.run(
                        update.status,
                        update.status === 'completed' ? new Date().toISOString() : null,
                        update.assigned_to || null,
                        id,
                        update.test_id
                    );
                }
            }

            // Commit transaction
            db.exec('COMMIT');

            return res.status(200).json({
                type: "success",
                data: { order_id: id },
                message: "Order updated successfully"
            });

        } catch (error) {
            db.exec('ROLLBACK');
            throw error;
        }

    } catch (error) {
        return next(new CustomError(error.message, error.statusCode || 500));
    }
});