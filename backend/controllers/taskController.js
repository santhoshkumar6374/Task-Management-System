const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Create/assign a new task to an employee (Admin only)
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, priority, dueDate } = req.body;

  if (!title || !description || !assignedTo) {
    res.status(400);
    throw new Error('Title, description and assigned employee are required');
  }

  const employee = await User.findOne({ _id: assignedTo, role: 'employee' });
  if (!employee) {
    res.status(404);
    throw new Error('Assigned employee not found');
  }

  const task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id,
    priority: priority || 'Medium',
    dueDate: dueDate || undefined,
  });

  const populatedTask = await task.populate([
    { path: 'assignedTo', select: 'name email department' },
    { path: 'assignedBy', select: 'name email' },
  ]);

  // Notify employee by email
  console.log(`[Task] Sending assignment email to employee: ${employee.email}`);
  await sendEmail({
    to: employee.email,
    subject: `New Task Assigned: ${title}`,
    html: `
      <h2>New Task Assigned</h2>
      <p>Hi ${employee.name},</p>
      <p>You have been assigned a new task by ${req.user.name}.</p>
      <table cellpadding="6" style="border-collapse:collapse;">
        <tr><td><strong>Title</strong></td><td>${title}</td></tr>
        <tr><td><strong>Description</strong></td><td>${description}</td></tr>
        <tr><td><strong>Priority</strong></td><td>${priority || 'Medium'}</td></tr>
      </table>
      <p>Please log in to the Task Management System to view details.</p>
    `,
  });

  res.status(201).json({ success: true, task: populatedTask });
});

// @desc    Get all tasks with search + pagination (Admin only)
// @route   GET /api/tasks?search=&status=&priority=&page=&limit=
// @access  Private/Admin
const getAllTasks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;

  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  let employeeFilter = null;
  if (req.query.employee) {
    employeeFilter = req.query.employee;
    filter.assignedTo = employeeFilter;
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    tasks,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @desc    Get dashboard task statistics (Admin only)
// @route   GET /api/tasks/stats
// @access  Private/Admin
const getTaskStats = asyncHandler(async (req, res) => {
  const stats = await Task.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const result = {
    'Not Started': 0,
    Pending: 0,
    'In Progress': 0,
    Completed: 0,
    total: 0,
  };

  stats.forEach((s) => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  res.json({ success: true, stats: result });
});

// @desc    Get tasks assigned to the logged-in employee (with search + pagination)
// @route   GET /api/tasks/my-tasks?search=&status=&page=&limit=
// @access  Private/Employee
const getMyTasks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const filter = { assignedTo: req.user._id };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    tasks,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
    },
  });
});

// @desc    Update task status (Employee — own tasks only)
// @route   PATCH /api/tasks/:id/status
// @access  Private/Employee
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['Not Started', 'Pending', 'In Progress', 'Completed'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const task = await Task.findById(req.params.id).populate('assignedBy', 'name email');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  if (task.assignedTo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to update this task');
  }

  task.status = status;
  task.statusNote = note ? note.trim() : '';
  await task.save();

  // Notify Admin by email — always send to the configured ADMIN_EMAIL so the
  // real admin inbox is reached regardless of the stored assignedBy address.
  const adminEmail = process.env.ADMIN_EMAIL || task.assignedBy.email;
  const adminName  = task.assignedBy.name || 'Admin';
  sendEmail({
    to: adminEmail,
    subject: `Task Status Updated: ${task.title}`,
    html: `
      <h2>Task Status Updated</h2>
      <p>Hi ${adminName},</p>
      <p>${req.user.name} has updated the status of a task.</p>
      <table cellpadding="6" style="border-collapse:collapse;">
        <tr><td><strong>Title</strong></td><td>${task.title}</td></tr>
        <tr><td><strong>New Status</strong></td><td>${status}</td></tr>
        <tr><td><strong>Updated By</strong></td><td>${req.user.name}</td></tr>
        ${task.statusNote ? `<tr><td><strong>Note / Reason</strong></td><td>${task.statusNote}</td></tr>` : ''}
      </table>
    `,
  });

  res.json({ success: true, task });
});

// @desc    Delete a task (Admin only)
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted successfully' });
});

module.exports = {
  createTask,
  getAllTasks,
  getTaskStats,
  getMyTasks,
  updateTaskStatus,
  deleteTask,
};
