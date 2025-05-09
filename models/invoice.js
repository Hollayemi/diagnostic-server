const { db } = require('../connection/db');

class Invoice {
    static createTable() {
        db.exec(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                invoice_number TEXT NOT NULL UNIQUE,
                invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                due_date DATETIME,
                status TEXT CHECK(status IN ('pending', 'paid', 'overdue')) DEFAULT 'pending',
                tax REAL DEFAULT 0,
                discount REAL DEFAULT 0,
                total_amount REAL NOT NULL,
                notes TEXT,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            );
      
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'transfer', 'insurance')),
                transaction_id TEXT,
                notes TEXT,
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
            );
        `);
    }

    static async generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const count = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE strftime("%Y", invoice_date) = ?').get(year).count;
        return `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;
    }
}

module.exports = Invoice;