const asyncHandler = require('express-async-handler');
const validator = require('validator');
const dns = require('dns').promises;
const User = require('../models/User');
const Task = require('../models/Task');

// Helper to check if an email's domain actually has MX records (can receive mail)
const checkEmailDomain = async (email) => {
  if (!email || !email.includes('@')) return false;
  const parts = email.split('@');
  const username = parts[0].toLowerCase();
  const domain = parts[1].toLowerCase();

  // Block common fake/disposable/test email domains
  const blockedDomains = ['test.com', 'example.com', 'domain.com', 'xyz.com', 'abc.com', 'temp.com', 'mailinator.com'];
  if (blockedDomains.includes(domain)) {
    return false;
  }

  // Block common typos of major mail services
  const commonTypos = ['gamil.com', 'gmal.com', 'gmaill.com', 'gamil.co', 'yaho.com', 'hotmal.com', 'outlok.com'];
  if (commonTypos.includes(domain)) {
    return false;
  }

  // Block common fake names/usernames on major providers
  const majorProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  if (majorProviders.includes(domain)) {
    const fakeKeywords = ['fake', 'test', 'dummy', 'temp', 'example', 'trash', 'user123', 'admin123', 'random'];
    if (fakeKeywords.some(keyword => username.includes(keyword))) {
      return false;
    }
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) return false;
    return true;
  } catch (error) {
    // ENOTFOUND / ENODATA means domain doesn't exist or has no mail servers
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return false;
    }
    // Fallback to true for transient network/DNS timeout errors so offline mode still works
    return true;
  }
};

// @desc    Create a new employee account (Admin only)
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  if (!validator.isEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  // Verify the email domain is real/original
  const isRealDomain = await checkEmailDomain(email);
  if (!isRealDomain) {
    res.status(400);
    throw new Error('The email domain does not exist or cannot receive mail. Please use a real email address.');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const employee = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    department: department || 'General',
    role: 'employee',
  });

  res.status(201).json({
    success: true,
    employee: {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      isActive: employee.isActive,
    },
  });
});

// @desc    Get list of all employees (Admin only)
// @route   GET /api/employees
// @access  Private/Admin
const getEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: 'employee' }).sort({ createdAt: -1 });
  res.json({ success: true, count: employees.length, employees });
});

// @desc    Activate / deactivate an employee (Admin only)
// @route   PATCH /api/employees/:id/status
// @access  Private/Admin
const toggleEmployeeStatus = asyncHandler(async (req, res) => {
  const employee = await User.findOne({ _id: req.params.id, role: 'employee' });
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }
  employee.isActive = !employee.isActive;
  await employee.save();
  res.json({ success: true, employee });
});

// @desc    Update employee profile (Admin only)
// @route   PUT /api/employees/:id
// @access  Private/Admin
const updateEmployee = asyncHandler(async (req, res) => {
  const { name, email, department, password } = req.body;

  const employee = await User.findOne({ _id: req.params.id, role: 'employee' });
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  if (email && email.toLowerCase() !== employee.email) {
    if (!validator.isEmail(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }
    const isRealDomain = await checkEmailDomain(email);
    if (!isRealDomain) {
      res.status(400);
      throw new Error('The email domain does not exist or cannot receive mail. Please use a real email address.');
    }
    const exists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: employee._id } });
    if (exists) {
      res.status(400);
      throw new Error('An account with this email already exists');
    }
    employee.email = email.toLowerCase();
  }

  if (name)       employee.name       = name.trim();
  if (department) employee.department = department.trim();
  if (password) {
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }
    employee.password = password; // pre-save hook will hash it
  }

  await employee.save();
  res.json({
    success: true,
    employee: {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      isActive: employee.isActive,
    },
  });
});

// @desc    Delete an employee (Admin only) — blocked if they still have tasks
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findOne({ _id: req.params.id, role: 'employee' });
  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  const taskCount = await Task.countDocuments({ assignedTo: employee._id });
  if (taskCount > 0) {
    res.status(400);
    throw new Error('Cannot delete an employee who has assigned tasks. Deactivate instead.');
  }

  await employee.deleteOne();
  res.json({ success: true, message: 'Employee removed' });
});

module.exports = { createEmployee, getEmployees, toggleEmployeeStatus, deleteEmployee, updateEmployee };
