const { db } = require('../connection/db');
const Invoice = require('../models/invoice');
const CustomError = require('../utility/customError');
const bigPromise = require('../middlewares/bigPromise');

exports.create = bigPromise(async (req, res, next) => {
  try {
    const { order_id, due_date, tax = 0, discount = 0, notes } = req.body;

    // Validate order exists
    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(order_id);
    if (!order) {
      return next(new CustomError('Order not found', 404));
    }

    // Calculate total from order tests
    const total = db.prepare(`
      SELECT SUM(t.price) as total 
      FROM order_tests ot
      JOIN tests t ON ot.test_id = t.id
      WHERE ot.order_id = ?
    `).get(order_id).total;

    if (!total) {
      return next(new CustomError('No tests found in this order', 400));
    }

    const invoice_number = await Invoice.generateInvoiceNumber();
    const calculated_due_date = due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { lastInsertRowid } = db.prepare(`
      INSERT INTO invoices (
        order_id,
        invoice_number,
        due_date,
        tax,
        discount,
        total_amount,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_id,
      invoice_number,
      calculated_due_date,
      tax,
      discount,
      total,
      notes
    );

    return res.status(201).json({
      type: "success",
      data: { id: lastInsertRowid, invoice_number },
      message: "Invoice created successfully"
    });

  } catch (error) {
    return next(new CustomError(error.message, 500));
  }
});

exports.getOne = bigPromise(async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = db.prepare(`
      SELECT i.*, p.name as patient_name, p.phone as patient_phone, 
             p.blood_group as patient_bllod_group, p.address as patient_address
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN patients p ON o.patient_id = p.id
      WHERE i.id = ?
    `).get(id);

    if (!invoice) {
      return next(new CustomError('Invoice not found', 404));
    }

    // Get tests for this invoice
    invoice.tests = db.prepare(`
      SELECT t.name, t.price, ot.status as test_status
      FROM order_tests ot
      JOIN tests t ON ot.test_id = t.id
      WHERE ot.order_id = ?
    `).all(invoice.order_id);

    // Get payments for this invoice
    invoice.payments = db.prepare(`
      SELECT * FROM payments 
      WHERE invoice_id = ?
      ORDER BY payment_date DESC
    `).all(id);

    return res.status(200).json({
      type: "success",
      data: invoice,
      message: "Invoice retrieved successfully"
    });

  } catch (error) {
    return next(new CustomError(error.message, 500));
  }
});

exports.recordPayment = bigPromise(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, transaction_id, notes } = req.body;

    // Validate invoice exists
    const invoice = db.prepare('SELECT id, status FROM invoices WHERE id = ?').get(id);
    if (!invoice) {
      return next(new CustomError('Invoice not found', 404));
    }

    // Record payment
    db.prepare(`
      INSERT INTO payments (
        invoice_id,
        amount,
        payment_method,
        transaction_id,
        notes
      ) VALUES (?, ?, ?, ?, ?)
    `).run(id, amount, payment_method, transaction_id, notes);

    // Calculate total paid
    const total_paid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE invoice_id = ?
    `).get(id).total;

    // Get invoice total
    const invoice_total = db.prepare(`
      SELECT total_amount + tax - discount as total 
      FROM invoices 
      WHERE id = ?
    `).get(id).total;

    // Update invoice status if fully paid
    if (total_paid >= invoice_total) {
      db.prepare('UPDATE invoices SET status = "paid" WHERE id = ?').run(id);
    }

    return res.status(200).json({
      type: "success",
      data: { invoice_id: id, amount },
      message: "Payment recorded successfully"
    });

  } catch (error) {
    return next(new CustomError(error.message, 500));
  }
});

exports.generateReceipt = bigPromise(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get invoice with all details
    const invoice = db.prepare(`
      SELECT i.*, p.name as patient_name, p.phone as patient_phone,
             p.blood_group as patient_blood_group, p.address as patient_address
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      JOIN patients p ON o.patient_id = p.id
      WHERE i.id = ?
    `).get(id);

    if (!invoice) {
      return next(new CustomError('Invoice not found', 404));
    }

    // Get tests
    invoice.tests = db.prepare(`
      SELECT t.name, t.price
      FROM order_tests ot
      JOIN tests t ON ot.test_id = t.id
      WHERE ot.order_id = ?
    `).all(invoice.order_id);

    // Get payments
    invoice.payments = db.prepare(`
      SELECT amount, payment_method, payment_date
      FROM payments
      WHERE invoice_id = ?
      ORDER BY payment_date DESC
    `).all(id);

    return res.status(200).json({
      type: "success",
      data: invoice,
      message: "Receipt data generated successfully"
    });

  } catch (error) {
    return next(new CustomError(error.message, 500));
  }
});