const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const path = require('path')
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
require("dotenv")

const authRouter = require("./routes/auth.js");
const patientRouter = require("./routes/patient.js");
const testRouter = require("./routes/test.js");
const orderRouter = require("./routes/order.js")
const invoiceRouter = require("./routes/invoice.js")
const { initializeDatabase } = require("./connection/db.js");

const port = 5000;

require('./connection/db.js');



initializeDatabase()

const app = express();


// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4173', 'https://diagnostic-temp.vercel.app'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
//Security Middleware Implementation
app.use(morgan("dev"));
app.use(helmet())
app.use(hpp())





//RequestBodySizeIncrease//Body Parser Implementation
app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));



//Request Rate Limit Implementation
const Limiter = rateLimit({
    windowMs: 15 * 60 * 1000,   //10 Minutes
    max: 3000   //Limit each IP to 100 requests per windowMs
})
app.use(Limiter);







//Managing Back-end Routing// Back-end Routing Implementation
//app.use('/api/v1', router);
app.use('/api', authRouter);
app.use('/api/patient', patientRouter);
app.use('/api/test', testRouter);
app.use('/api/order', orderRouter);
app.use('/api/invoice', invoiceRouter);



//Testing-Route- HomPage
app.get('/', (req, res) => {
    res.send('This is Daignostics center server')
})



//Undefined Route
app.use('*', (req, res) => {
    res.status(404).json({ message: "Fail", data: "Route Not Found" });
});



// Error handling middleware (add this if you didn't have it before)
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).send('Something broke!');
// });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});