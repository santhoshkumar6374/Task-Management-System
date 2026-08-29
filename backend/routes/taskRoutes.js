const express = require('express');
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTaskStats,
  getMyTasks,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Employee routes
router.get('/my-tasks', authorize('employee'), getMyTasks);
router.patch('/:id/status', authorize('employee'), updateTaskStatus);

// Admin routes
router.get('/stats', authorize('admin'), getTaskStats);
router.route('/').get(authorize('admin'), getAllTasks).post(authorize('admin'), createTask);
router.delete('/:id', authorize('admin'), deleteTask);

module.exports = router;
