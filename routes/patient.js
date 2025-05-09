const express = require('express');
const PatientController = require("../controllers/patientContoller");
const { protect, IsAdmin } = require("../middlewares/AuthVerifyMiddleware");

const router = express.Router();


router.post('/create', protect, PatientController.create);
router.get("/get-all", protect, PatientController.getAll);
router.delete('/delete/:id', protect, IsAdmin, PatientController.delete);
router.put('/update-status/:id', protect, PatientController.update);
router.get('/get/:id', protect, PatientController.getById);


module.exports = router;

