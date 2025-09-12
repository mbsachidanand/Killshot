/**
 * Group Service
 * Handles business logic for group operations
 *
 * @fileoverview TypeScript implementation of the Group service with full type safety
 */

import GroupModel from '@/models/Group';
import { CreateGroupRequest, Expense, Group, GroupMember, Service, UpdateGroupRequest } from '@/types';

/**
 * Group Service Class
 *
 * This class handles all business logic for group operations including
 * CRUD operations, member management, and expense management.
 */
export class GroupService implements Service<Group, CreateGroupRequest, UpdateGroupRequest> {
  private groups: Map<string, GroupModel>;

  constructor() {
    // In-memory storage for now - replace with database in production
    this.groups = new Map();
    this.initializeSampleData();
  }

  /**
   * Initialize with sample data
   *
   * @private
   */
  private initializeSampleData(): void {
    const sampleGroups: Array<{
      id: string;
      name: string;
      description: string;
      members: Array<{
        id: string;
        name: string;
        email: string;
      }>;
    }> = [
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
      const group = new GroupModel(groupData.id, groupData.name, groupData.description);
      groupData.members.forEach(member => {
        group.addMember(member);
      });
      this.groups.set(groupData.id, group);
    });
  }

  /**
   * Get all groups
   *
   * @returns {Promise<Group[]>} Array of full group data
   * @throws {Error} If fetching groups fails
   */
  async findAll(): Promise<Group[]> {
    try {
      const groups = Array.from(this.groups.values());
      return groups.map(group => group.toJSON());
    } catch (error) {
      throw new Error(`Failed to fetch groups: ${(error as Error).message}`);
    }
  }

  /**
   * Get all groups (alias for findAll for backward compatibility)
   *
   * @returns {Promise<Group[]>} Array of full group data
   */
  async getAllGroups(): Promise<Group[]> {
    return this.findAll();
  }

  /**
   * Get a specific group by ID
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<Group | null>} Group details or null if not found
   * @throws {Error} If fetching group fails
   */
  async findById(groupId: string): Promise<Group | null> {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        return null;
      }
      return group.toJSON();
    } catch (error) {
      throw new Error(`Failed to fetch group: ${(error as Error).message}`);
    }
  }

  /**
   * Get a specific group by ID (alias for findById for backward compatibility)
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<Group>} Group details
   * @throws {Error} If group not found or fetching fails
   */
  async getGroupById(groupId: string): Promise<Group> {
    const group = await this.findById(groupId);
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`);
    }
    return group;
  }

  /**
   * Create a new group
   *
   * @param {CreateGroupRequest} groupData - Group data
   * @returns {Promise<Group>} Created group
   * @throws {Error} If group creation fails
   */
  async create(groupData: CreateGroupRequest): Promise<Group> {
    try {
      const { name, description = '' } = groupData;

      if (!name || name.trim() === '') {
        throw new Error('Group name is required');
      }

      const id = (this.groups.size + 1).toString();
      const group = new GroupModel(id, name.trim(), description.trim());
      this.groups.set(id, group);

      return group.toJSON();
    } catch (error) {
      throw new Error(`Failed to create group: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new group (alias for create for backward compatibility)
   *
   * @param {CreateGroupRequest} groupData - Group data
   * @returns {Promise<Group>} Created group
   */
  async createGroup(groupData: CreateGroupRequest): Promise<Group> {
    return this.create(groupData);
  }

  /**
   * Update a group
   *
   * @param {string} groupId - Group ID
   * @param {UpdateGroupRequest} updateData - Data to update
   * @returns {Promise<Group>} Updated group
   * @throws {Error} If group update fails
   */
  async update(groupId: string, updateData: UpdateGroupRequest): Promise<Group> {
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
      return group.toJSON();
    } catch (error) {
      throw new Error(`Failed to update group: ${(error as Error).message}`);
    }
  }

  /**
   * Update a group (alias for update for backward compatibility)
   *
   * @param {string} groupId - Group ID
   * @param {UpdateGroupRequest} updateData - Data to update
   * @returns {Promise<Group>} Updated group
   */
  async updateGroup(groupId: string, updateData: UpdateGroupRequest): Promise<Group> {
    return this.update(groupId, updateData);
  }

  /**
   * Delete a group
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If group deletion fails
   */
  async delete(groupId: string): Promise<boolean> {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      this.groups.delete(groupId);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete group: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a group (alias for delete for backward compatibility)
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteGroup(groupId: string): Promise<boolean> {
    return this.delete(groupId);
  }

  /**
   * Add member to group
   *
   * @param {string} groupId - Group ID
   * @param {GroupMember} memberData - Member data
   * @returns {Promise<Group>} Updated group
   * @throws {Error} If adding member fails
   */
  async addMemberToGroup(groupId: string, memberData: {
    id: string;
    name: string;
    email: string;
  }): Promise<Group> {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      group.addMember(memberData);
      return group.toJSON();
    } catch (error) {
      throw new Error(`Failed to add member: ${(error as Error).message}`);
    }
  }

  /**
   * Remove member from group
   *
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Group>} Updated group
   * @throws {Error} If removing member fails
   */
  async removeMemberFromGroup(groupId: string, memberId: string): Promise<Group> {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      group.removeMember(memberId);
      return group.toJSON();
    } catch (error) {
      throw new Error(`Failed to remove member: ${(error as Error).message}`);
    }
  }

  /**
   * Add an expense to a group
   *
   * @param {string} groupId - Group ID
   * @param {Expense} expense - Expense object
   * @returns {Promise<Group>} Updated group
   * @throws {Error} If adding expense fails
   */
  async addExpenseToGroup(groupId: string, expense: Expense): Promise<Group> {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      group.addExpense(expense);
      return group.toJSON();
    } catch (error) {
      throw new Error(`Failed to add expense to group: ${(error as Error).message}`);
    }
  }

  /**
   * Remove an expense from a group
   *
   * @param {string} groupId - Group ID
   * @param {string} expenseId - Expense ID
   * @returns {Promise<Group>} Updated group
   * @throws {Error} If removing expense fails
   */
  async removeExpenseFromGroup(groupId: string, expenseId: string): Promise<Group> {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      group.removeExpense(expenseId);
      return group.toJSON();
    } catch (error) {
      throw new Error(`Failed to remove expense from group: ${(error as Error).message}`);
    }
  }

  /**
   * Get expenses for a group
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<Expense[]>} Array of expenses
   * @throws {Error} If fetching expenses fails
   */
  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      return group.expenses;
    } catch (error) {
      throw new Error(`Failed to get group expenses: ${(error as Error).message}`);
    }
  }

  /**
   * Search groups by name or description
   *
   * @param {string} query - Search query
   * @returns {Promise<Group[]>} Array of matching groups
   */
  async searchGroups(query: string): Promise<Group[]> {
    try {
      const groups = Array.from(this.groups.values());
      const searchTerm = query.toLowerCase();

      return groups
        .filter(group =>
          group.name.toLowerCase().includes(searchTerm) ||
          group.description.toLowerCase().includes(searchTerm)
        )
        .map(group => group.toJSON());
    } catch (error) {
      throw new Error(`Failed to search groups: ${(error as Error).message}`);
    }
  }

  /**
   * Get groups by member ID
   *
   * @param {string} memberId - Member ID
   * @returns {Promise<Group[]>} Array of groups containing the member
   */
  async getGroupsByMember(memberId: string): Promise<Group[]> {
    try {
      const groups = Array.from(this.groups.values());

      return groups
        .filter(group => group.members.some(member => member.id === memberId))
        .map(group => group.toJSON());
    } catch (error) {
      throw new Error(`Failed to get groups by member: ${(error as Error).message}`);
    }
  }

  /**
   * Get group statistics
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<object>} Group statistics
   */
  async getGroupStats(groupId: string): Promise<{
    totalMembers: number;
    totalExpenses: number;
    totalAmount: number;
    averageExpense: number;
  }> {
    try {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      const totalMembers = group.members.length;
      const totalExpenses = group.expenses.length;
      const totalAmount = group.getTotalExpenses();
      const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

      return {
        totalMembers,
        totalExpenses,
        totalAmount,
        averageExpense
      };
    } catch (error) {
      throw new Error(`Failed to get group stats: ${(error as Error).message}`);
    }
  }

  /**
   * Get all groups count
   *
   * @returns {Promise<number>} Total number of groups
   */
  async getGroupsCount(): Promise<number> {
    return this.groups.size;
  }

  /**
   * Check if group exists
   *
   * @param {string} groupId - Group ID
   * @returns {Promise<boolean>} True if group exists
   */
  async groupExists(groupId: string): Promise<boolean> {
    return this.groups.has(groupId);
  }
}

export default GroupService;
