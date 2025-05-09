const Database = require('better-sqlite3');
const { testData, populateDefaultAdmin } = require('./setup');

// Initialize database
const db = new Database('diagnostic.db');

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  try {
    db.exec(`

      -- create categories table
      DROP TABLE IF EXISTS tests;
      DROP TABLE IF EXISTS groups;

      CREATE TABLE groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        duration TEXT NOT NULL,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        group_id INTEGER,
        FOREIGN KEY (group_id) REFERENCES groups(id)
      );

      -- Patients Table
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
        phone TEXT NOT NULL,
        blood_group TEXT,
        address TEXT,
        image_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Staff Table
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        password TEXT,
        status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tests Table
      CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        turnaround_time TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES test_categories(id)
      );

      -- Orders Table
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        staff_id INTEGER NOT NULL,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK(status IN ('pending', 'in-progress', 'completed')) DEFAULT 'pending',
        notes TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (staff_id) REFERENCES staff(id)
      );

      -- Order Tests Junction Table
      CREATE TABLE IF NOT EXISTS order_tests (
        order_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending', 'in-progress', 'completed')) DEFAULT 'pending',
        result TEXT,
        completed_at DATETIME,
        assigned_to INTEGER,
        PRIMARY KEY (order_id, test_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id),
        FOREIGN KEY (assigned_to) REFERENCES staff(id)
      );

      -- Invoices Table
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
        payment_method TEXT,
        payment_date DATETIME,
        notes TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );

      -- Payments Table
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        payment_method TEXT,
        transaction_id TEXT,
        notes TEXT,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id)
      );
    `);

    // Insert initial test categories if they don't exist

    const insertGroup = db.prepare('INSERT INTO groups (name) VALUES (?)');
    const insertTest = db.prepare('INSERT INTO tests (name, price, duration, group_id) VALUES (?, ?, ?, ?)');

    testData.map(({ name, tests }) => {
      const groupInfo = insertGroup.run(name);
      const groupId = groupInfo.lastInsertRowid;
      tests.map(e => insertTest.run(e.name, e.price, e.duration, groupId))
    })

    populateDefaultAdmin(db)
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = { db, initializeDatabase };