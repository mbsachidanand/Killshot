/**
 * Group Routes
 * Defines API endpoints for group operations
 */

const express = require('express');
const GroupController = require('../controllers/GroupController');
const { commonValidations, handleValidationErrors, sanitizeInput } = require('../middleware/validation');
const { cacheMiddleware, cacheKeys, invalidateCache } = require('../middleware/cache');

const router = express.Router();
const groupController = new GroupController();

// Sanitize input middleware
router.use(sanitizeInput);

// Validation middleware
const validateGroupData = [
  commonValidations.groupName,
  commonValidations.description,
  handleValidationErrors
];

const validateGroupId = [
  commonValidations.id,
  handleValidationErrors
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
router.get('/', cacheMiddleware(cacheKeys.groups, 2 * 60 * 1000), groupController.getAllGroups.bind(groupController));

/**
 * @route   GET /api/v1/groups/:id
 * @desc    Get a specific group by ID
 * @access  Public
 */
router.get('/:id', validateGroupId, cacheMiddleware(cacheKeys.groupById, 5 * 60 * 1000), groupController.getGroupById.bind(groupController));

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
