/**
 * Group Controller
 * Handles HTTP requests for group operations
 */

const GroupServiceDB = require('../services/GroupServiceDB');
const { validationResult } = require('express-validator');
const { invalidateCache } = require('../middleware/cache');

class GroupController {
  constructor() {
    this.groupService = new GroupServiceDB();
  }

  /**
   * Get all groups
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllGroups(req, res) {
    try {
      const groups = await this.groupService.getAllGroups();
      
      res.status(200).json({
        success: true,
        message: 'Groups fetched successfully',
        data: groups,
        count: groups.length
      });
    } catch (error) {
      console.error('Error fetching groups:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get a specific group by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getGroupById(req, res) {
    try {
      const { id } = req.params;
      const group = await this.groupService.getGroupById(id);
      
      res.status(200).json({
        success: true,
        message: 'Group fetched successfully',
        data: group
      });
    } catch (error) {
      console.error('Error fetching group:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Group not found',
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error.message
        });
      }
    }
  }

  /**
   * Create a new group
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createGroup(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const groupData = req.body;
      const newGroup = await this.groupService.createGroup(groupData);
      
      // Invalidate groups cache
      invalidateCache('groups:');
      
      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: newGroup
      });
    } catch (error) {
      console.error('Error creating group:', error);
      
      if (error.message.includes('required') || error.message.includes('empty')) {
        res.status(400).json({
          success: false,
          message: 'Bad request',
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error.message
        });
      }
    }
  }

  /**
   * Update a group
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateGroup(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;
      const updatedGroup = this.groupService.updateGroup(id, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Group updated successfully',
        data: updatedGroup
      });
    } catch (error) {
      console.error('Error updating group:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Group not found',
          error: error.message
        });
      } else if (error.message.includes('empty')) {
        res.status(400).json({
          success: false,
          message: 'Bad request',
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error.message
        });
      }
    }
  }

  /**
   * Delete a group
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      const success = this.groupService.deleteGroup(id);
      
      if (success) {
        res.status(200).json({
          success: true,
          message: 'Group deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete group'
        });
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Group not found',
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error.message
        });
      }
    }
  }

  /**
   * Add member to group
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addMemberToGroup(req, res) {
    try {
      const { id } = req.params;
      const memberData = req.body;
      const updatedGroup = this.groupService.addMemberToGroup(id, memberData);
      
      res.status(200).json({
        success: true,
        message: 'Member added successfully',
        data: updatedGroup
      });
    } catch (error) {
      console.error('Error adding member:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Group not found',
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error.message
        });
      }
    }
  }

  /**
   * Remove member from group
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removeMemberFromGroup(req, res) {
    try {
      const { id, memberId } = req.params;
      const updatedGroup = this.groupService.removeMemberFromGroup(id, memberId);
      
      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
        data: updatedGroup
      });
    } catch (error) {
      console.error('Error removing member:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Group not found',
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: error.message
        });
      }
    }
  }
}

module.exports = GroupController;
