const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

router.post('/create', staffController.create);
router.get('/get-all', staffController.getAll);
router.get('/get-one/:id', staffController.getOne);
router.put('/update/:id', staffController.update);
router.delete('/delete/:id', staffController.delete);
router.patch('/deactivate/:id/status', staffController.deactivate);

module.exports = router;