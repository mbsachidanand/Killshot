/**
 * Group Routes
 * Defines API endpoints for group operations
 */

const express = require('express');
const { body, param } = require('express-validator');
const GroupController = require('../controllers/GroupController');

const router = express.Router();
const groupController = new GroupController();

// Validation middleware
const validateGroupData = [
  body('name')
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .trim()
];

const validateGroupId = [
  param('id')
    .notEmpty()
    .withMessage('Group ID is required')
    .isLength({ min: 1 })
    .withMessage('Group ID must be valid')
];

const validateMemberData = [
  body('id')
    .notEmpty()
    .withMessage('Member ID is required'),
  body('name')
    .notEmpty()
    .withMessage('Member name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Member name must be between 1 and 100 characters')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
];

const validateMemberId = [
  param('memberId')
    .notEmpty()
    .withMessage('Member ID is required')
    .isLength({ min: 1 })
    .withMessage('Member ID must be valid')
];

/**
 * @route   GET /api/v1/groups
 * @desc    Get all groups
 * @access  Public
 */
router.get('/', groupController.getAllGroups.bind(groupController));

/**
 * @route   GET /api/v1/groups/:id
 * @desc    Get a specific group by ID
 * @access  Public
 */
router.get('/:id', validateGroupId, groupController.getGroupById.bind(groupController));

/**
 * @route   POST /api/v1/groups
 * @desc    Create a new group
 * @access  Public
 */
router.post('/', validateGroupData, groupController.createGroup.bind(groupController));

/**
 * @route   PUT /api/v1/groups/:id
 * @desc    Update a group
 * @access  Public
 */
router.put('/:id', [...validateGroupId, ...validateGroupData], groupController.updateGroup.bind(groupController));

/**
 * @route   DELETE /api/v1/groups/:id
 * @desc    Delete a group
 * @access  Public
 */
router.delete('/:id', validateGroupId, groupController.deleteGroup.bind(groupController));

/**
 * @route   POST /api/v1/groups/:id/members
 * @desc    Add a member to a group
 * @access  Public
 */
router.post('/:id/members', [...validateGroupId, ...validateMemberData], groupController.addMemberToGroup.bind(groupController));

/**
 * @route   DELETE /api/v1/groups/:id/members/:memberId
 * @desc    Remove a member from a group
 * @access  Public
 */
router.delete('/:id/members/:memberId', [...validateGroupId, ...validateMemberId], groupController.removeMemberFromGroup.bind(groupController));

module.exports = router;
