/**
 * Group Routes
 * Defines all routes for group operations
 *
 * @fileoverview TypeScript implementation of group routes with full type safety
 */

import { GroupController } from '@/controllers/GroupController';
import {
    createGroupValidation,
    groupIdValidation,
    searchValidation,
    updateGroupValidation,
    validateMemberData
} from '@/middleware/validation';
import { Router } from 'express';

/**
 * Group Routes Router
 *
 * This router defines all the routes for group operations including
 * CRUD operations, member management, and group statistics.
 */
const router: Router = Router();

// Initialize controller
const groupController = new GroupController();

/**
 * @route   GET /api/v1/groups
 * @desc    Get all groups with optional pagination and search
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   search - Search query for group name or description
 */
router.get('/', groupController.getAllGroups);

/**
 * @route   GET /api/v1/groups/search
 * @desc    Search groups by name or description
 * @access  Public
 * @query   q - Search query (required)
 */
router.get('/search', searchValidation, groupController.searchGroups);

/**
 * @route   GET /api/v1/groups/:id
 * @desc    Get a specific group by ID
 * @access  Public
 * @param   id - Group ID
 */
router.get('/:id', groupIdValidation, groupController.getGroupById);

/**
 * @route   POST /api/v1/groups
 * @desc    Create a new group
 * @access  Public
 * @body    name - Group name (required)
 * @body    description - Group description (optional)
 * @body    memberEmails - Array of member emails (optional)
 */
router.post('/', createGroupValidation, groupController.createGroup);

/**
 * @route   PUT /api/v1/groups/:id
 * @desc    Update a group
 * @access  Public
 * @param   id - Group ID
 * @body    name - Group name (optional)
 * @body    description - Group description (optional)
 */
router.put('/:id', groupIdValidation, updateGroupValidation, groupController.updateGroup);

/**
 * @route   DELETE /api/v1/groups/:id
 * @desc    Delete a group
 * @access  Public
 * @param   id - Group ID
 */
router.delete('/:id', groupIdValidation, groupController.deleteGroup);

/**
 * @route   POST /api/v1/groups/:id/members
 * @desc    Add a member to a group
 * @access  Public
 * @param   id - Group ID
 * @body    email - Member email (required)
 * @body    name - Member name (required)
 */
router.post('/:id/members', groupIdValidation, validateMemberData, groupController.addMemberToGroup);

/**
 * @route   DELETE /api/v1/groups/:id/members/:memberId
 * @desc    Remove a member from a group
 * @access  Public
 * @param   id - Group ID
 * @param   memberId - Member ID
 */
router.delete('/:id/members/:memberId', groupIdValidation, groupController.removeMemberFromGroup);

/**
 * @route   GET /api/v1/groups/:id/expenses
 * @desc    Get all expenses for a group
 * @access  Public
 * @param   id - Group ID
 */
router.get('/:id/expenses', groupIdValidation, groupController.getGroupExpenses);

/**
 * @route   GET /api/v1/groups/:id/stats
 * @desc    Get group statistics
 * @access  Public
 * @param   id - Group ID
 */
router.get('/:id/stats', groupIdValidation, groupController.getGroupStats);

export default router;
