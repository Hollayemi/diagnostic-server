const { db } = require('../connection/db.js');

module.exports.generateInvoiceNumber = () => {
    const year = new Date().getFullYear();

    // Corrected strftime syntax - format specifier should NOT be in quotes
    const count = db.prepare(`
    SELECT COUNT(*) as count 
    FROM invoices 
    WHERE strftime('%Y', invoice_date) = ?
  `).get(year.toString()).count;

    return `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;
};