/**
 * Group Service with Database Integration
 * Handles business logic for group operations using database
 */

const { DatabaseFactory } = require('../database/DatabaseFactory');

class GroupServiceDB {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    if (!this.db) {
      const factory = DatabaseFactory.getInstance();
      this.db = factory.getDefaultAdapter();
      await this.db.connect();
    }
  }

  /**
   * Get all groups with their members
   */
  async getAllGroups() {
    try {
      await this.initialize();

      const groupsQuery = `
        SELECT
          g.id,
          g.name,
          g.description,
          g.created_at,
          g.updated_at,
          g.created_by,
          (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
          (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.group_id = g.id) as total_expenses
        FROM groups g
        ORDER BY g.created_at DESC
      `;

      const groupsResult = await this.db.query(groupsQuery);
      const groups = groupsResult.rows || [];

      // Transform the data to match iOS expectations
      for (const group of groups) {
        group.memberCount = parseInt(group.member_count) || 0;
        group.totalExpenses = parseFloat(group.total_expenses) || 0.0;
        group.createdAt = group.created_at;
        group.updatedAt = group.updated_at;
        group.createdBy = group.created_by || 'unknown';
      }

      // Get members for each group
      for (const group of groups) {
        const membersQuery = `
          SELECT
            m.id,
            m.name,
            m.email,
            gm.joined_at
          FROM members m
          JOIN group_members gm ON m.id = gm.member_id
          WHERE gm.group_id = $1
          ORDER BY gm.joined_at
        `;

        const membersResult = await this.db.query(membersQuery, [group.id]);
        group.members = membersResult.rows || [];

        // Get expenses for each group
        const expensesQuery = `
          SELECT
            e.id,
            e.title,
            e.amount,
            e.paid_by,
            e.split_type,
            e.date,
            e.group_id,
            e.description,
            e.created_at,
            e.updated_at
          FROM expenses e
          WHERE e.group_id = $1
          ORDER BY e.created_at DESC
        `;

        const expensesResult = await this.db.query(expensesQuery, [group.id]);
        group.expenses = expensesResult.rows || [];

        // Transform the data to match iOS expectations
        group.memberCount = parseInt(group.member_count) || 0;
        group.totalExpenses = parseFloat(group.total_expenses) || 0.0;
        group.createdAt = group.created_at;
        group.updatedAt = group.updated_at;

        // Transform members data
        group.members = group.members.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          joinedAt: member.joined_at
        }));

        // Transform expenses data
        group.expenses = group.expenses.map(expense => ({
          id: expense.id,
          title: expense.title,
          amount: parseFloat(expense.amount),
          paidBy: expense.paid_by,
          splitType: expense.split_type,
          date: expense.date,
          groupId: expense.group_id,
          description: expense.description,
          createdAt: expense.created_at,
          updatedAt: expense.updated_at,
          splits: [] // Initialize empty split details for now
        }));

        // Remove the original snake_case fields
        delete group.member_count;
        delete group.total_expenses;
        delete group.created_by;
        delete group.created_at;
        delete group.updated_at;
      }

      return groups;
    } catch (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }
  }

  /**
   * Get a specific group by ID with members and expenses
   */
  async getGroupById(groupId) {
    try {
      await this.initialize();

      const groupQuery = `
        SELECT
          g.id,
          g.name,
          g.description,
          g.created_at,
          g.updated_at,
          g.created_by,
          (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
          (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.group_id = g.id) as total_expenses
        FROM groups g
        WHERE g.id = $1
      `;

      const group = await this.db.getOne(groupQuery, [groupId]);
      if (!group) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      // Transform the data to match iOS expectations
      group.memberCount = parseInt(group.member_count) || 0;
      group.totalExpenses = parseFloat(group.total_expenses) || 0.0;
      group.createdAt = group.created_at;
      group.updatedAt = group.updated_at;
      group.createdBy = group.created_by || 'unknown';

      // Get members
      const membersQuery = `
        SELECT
          m.id,
          m.name,
          m.email,
          gm.joined_at
        FROM members m
        JOIN group_members gm ON m.id = gm.member_id
        WHERE gm.group_id = $1
        ORDER BY gm.joined_at
      `;

      group.members = await this.db.getMany(membersQuery, [groupId]);

      // Get expenses
      const expensesQuery = `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.paid_by,
          e.split_type,
          e.date,
          e.group_id,
          e.description,
          e.created_at,
          e.updated_at
        FROM expenses e
        WHERE e.group_id = $1
        ORDER BY e.created_at DESC
      `;

      group.expenses = await this.db.getMany(expensesQuery, [groupId]);

      // Transform the data to match iOS expectations
      group.createdAt = group.created_at;
      group.updatedAt = group.updated_at;
      group.memberCount = group.members.length;
      group.totalExpenses = group.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      // Transform members data
      group.members = group.members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        joinedAt: member.joined_at
      }));

      // Transform expenses data
      group.expenses = group.expenses.map(expense => ({
        id: expense.id,
        title: expense.title,
        amount: parseFloat(expense.amount),
        paidBy: expense.paid_by,
        splitType: expense.split_type,
        date: expense.date,
        groupId: expense.group_id,
        description: expense.description,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at,
        splits: [] // Initialize empty split details for now
      }));

      // Remove the original snake_case fields
      delete group.created_at;
      delete group.updated_at;
      delete group.created_by;

      return group;
    } catch (error) {
      throw new Error(`Failed to fetch group: ${error.message}`);
    }
  }

  /**
   * Create a new group
   */
  async createGroup(groupData) {
    try {
      await this.initialize();

      const { name, description, members = [] } = groupData;

      if (!name || name.trim() === '') {
        throw new Error('Group name is required');
      }

      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create group
      const group = await this.db.insert('groups', {
        id: groupId,
        name: name.trim(),
        description: description || ''
      });

      // Add members if provided
      for (const member of members) {
        await this.addMemberToGroup(groupId, member);
      }

      return await this.getGroupById(groupId);
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  /**
   * Update a group
   */
  async updateGroup(groupId, updateData) {
    try {
      await this.initialize();

      const { name, description } = updateData;

      const updateFields = {};
      if (name !== undefined) updateFields.name = name.trim();
      if (description !== undefined) updateFields.description = description;

      if (Object.keys(updateFields).length === 0) {
        throw new Error('No valid fields to update');
      }

      const updatedGroup = await this.db.update('groups', updateFields, { id: groupId });

      if (!updatedGroup) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      return await this.getGroupById(groupId);
    } catch (error) {
      throw new Error(`Failed to update group: ${error.message}`);
    }
  }

  /**
   * Delete a group
   */
  async deleteGroup(groupId) {
    try {
      await this.initialize();

      const group = await this.getGroupById(groupId);
      await this.db.delete('groups', { id: groupId });

      return group;
    } catch (error) {
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  /**
   * Add a member to a group
   */
  async addMemberToGroup(groupId, memberData) {
    try {
      await this.initialize();

      const { id, name, email } = memberData;

      if (!id || !name || !email) {
        throw new Error('Member ID, name, and email are required');
      }

      // Check if member exists, create if not
      const existingMember = await this.db.getOne('SELECT id FROM members WHERE id = $1', [id]);
      if (!existingMember) {
        await this.db.insert('members', { id, name, email });
      }

      // Check if member is already in group
      const existingGroupMember = await this.db.exists('group_members', {
        group_id: groupId,
        member_id: id
      });

      if (existingGroupMember) {
        throw new Error('Member is already in this group');
      }

      // Add member to group
      await this.db.insert('group_members', {
        group_id: groupId,
        member_id: id
      });

      return await this.getGroupById(groupId);
    } catch (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }
  }

  /**
   * Remove a member from a group
   */
  async removeMemberFromGroup(groupId, memberId) {
    try {
      await this.initialize();

      const deletedMember = await this.db.delete('group_members', {
        group_id: groupId,
        member_id: memberId
      });

      if (!deletedMember) {
        throw new Error('Member not found in this group');
      }

      return await this.getGroupById(groupId);
    } catch (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  /**
   * Add an expense to a group
   */
  async addExpenseToGroup(groupId, expense) {
    try {
      await this.initialize();

      // This method is called by ExpenseService
      // The expense is already created, we just need to verify the group exists
      // The group totals will be calculated dynamically when fetched
      const group = await this.getGroupById(groupId);

      // Log for debugging
      console.log(`✅ Expense ${expense.id} added to group ${groupId}`);

      return group;
    } catch (error) {
      throw new Error(`Failed to add expense to group: ${error.message}`);
    }
  }

  /**
   * Remove an expense from a group
   */
  async removeExpenseFromGroup(groupId, expenseId) {
    try {
      await this.initialize();

      // This method is called by ExpenseService
      // The expense is already deleted, we just need to verify the group exists
      const group = await this.getGroupById(groupId);
      return group;
    } catch (error) {
      throw new Error(`Failed to remove expense from group: ${error.message}`);
    }
  }

  /**
   * Get group expenses
   */
  async getGroupExpenses(groupId) {
    try {
      await this.initialize();

      const expensesQuery = `
        SELECT
          e.id,
          e.title,
          e.amount,
          e.paid_by,
          e.split_type,
          e.date,
          e.description,
          e.created_at,
          e.updated_at
        FROM expenses e
        WHERE e.group_id = $1
        ORDER BY e.created_at DESC
      `;

      return await this.db.getMany(expensesQuery, [groupId]);
    } catch (error) {
      throw new Error(`Failed to get group expenses: ${error.message}`);
    }
  }
}

module.exports = GroupServiceDB;
