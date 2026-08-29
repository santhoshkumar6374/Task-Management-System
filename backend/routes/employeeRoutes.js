const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getEmployees,
  toggleEmployeeStatus,
  deleteEmployee,
  updateEmployee,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));

router.route('/').get(getEmployees).post(createEmployee);
router.patch('/:id/status', toggleEmployeeStatus);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
