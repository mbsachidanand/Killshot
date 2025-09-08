/**
 * Group Service
 * Handles business logic for group operations
 */

const Group = require('../models/Group');

class GroupService {
  constructor() {
    // In-memory storage for now - replace with database in production
    this.groups = new Map();
    this.initializeSampleData();
  }

  /**
   * Initialize with sample data
   */
  initializeSampleData() {
    const sampleGroups = [
      {
        id: '1',
        name: 'Weekend Trip',
        description: 'Expenses for our weekend getaway',
        members: [
          { id: '1', name: 'Rishab', email: 'rishab@example.com' },
          { id: '2', name: 'Sarah', email: 'sarah@example.com' }
        ]
      },
      {
        id: '2',
        name: 'Office Lunch',
        description: 'Daily lunch expenses with colleagues',
        members: [
          { id: '1', name: 'Rishab', email: 'rishab@example.com' },
          { id: '3', name: 'Alex', email: 'alex@example.com' }
        ]
      },
      {
        id: '3',
        name: 'House Sharing',
        description: 'Monthly rent and utility bills',
        members: [
          { id: '1', name: 'Rishab', email: 'rishab@example.com' },
          { id: '4', name: 'Emma', email: 'emma@example.com' }
        ]
      },
      {
        id: '4',
        name: 'Gym Membership',
        description: 'Shared gym membership and fitness expenses',
        members: [
          { id: '1', name: 'Rishab', email: 'rishab@example.com' },
          { id: '2', name: 'Sarah', email: 'sarah@example.com' },
          { id: '3', name: 'Alex', email: 'alex@example.com' }
        ]
      }
    ];

    sampleGroups.forEach(groupData => {
      const group = new Group(groupData.id, groupData.name, groupData.description);
      groupData.members.forEach(member => {
        group.addMember(member);
      });
      this.groups.set(groupData.id, group);
    });
  }

  /**
   * Get all groups
   * @returns {Array} Array of full group data
   */
  getAllGroups() {
    try {
      const groups = Array.from(this.groups.values());
      return groups.map(group => group.toJSON());
    } catch (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }
  }

  /**
   * Get a specific group by ID
   * @param {string} groupId - Group ID
   * @returns {Object} Group details
   */
  getGroupById(groupId) {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }
      return group.toJSON();
    } catch (error) {
      throw new Error(`Failed to fetch group: ${error.message}`);
    }
  }

  /**
   * Create a new group
   * @param {Object} groupData - Group data
   * @returns {Object} Created group
   */
  createGroup(groupData) {
    try {
      const { name, description = '' } = groupData;
      
      if (!name || name.trim() === '') {
        throw new Error('Group name is required');
      }

      const id = (this.groups.size + 1).toString();
      const group = new Group(id, name.trim(), description.trim());
      this.groups.set(id, group);
      
      return group.getSummary();
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  /**
   * Update a group
   * @param {string} groupId - Group ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated group
   */
  updateGroup(groupId, updateData) {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      if (updateData.name !== undefined) {
        if (!updateData.name || updateData.name.trim() === '') {
          throw new Error('Group name cannot be empty');
        }
        group.name = updateData.name.trim();
      }

      if (updateData.description !== undefined) {
        group.description = updateData.description.trim();
      }

      group.updatedAt = new Date();
      return group.getSummary();
    } catch (error) {
      throw new Error(`Failed to update group: ${error.message}`);
    }
  }

  /**
   * Delete a group
   * @param {string} groupId - Group ID
   * @returns {boolean} Success status
   */
  deleteGroup(groupId) {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      this.groups.delete(groupId);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  /**
   * Add member to group
   * @param {string} groupId - Group ID
   * @param {Object} memberData - Member data
   * @returns {Object} Updated group
   */
  addMemberToGroup(groupId, memberData) {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      group.addMember(memberData);
      return group.getSummary();
    } catch (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }
  }

  /**
   * Remove member from group
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @returns {Object} Updated group
   */
  removeMemberFromGroup(groupId, memberId) {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      group.removeMember(memberId);
      return group.getSummary();
    } catch (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }
}

module.exports = GroupService;
