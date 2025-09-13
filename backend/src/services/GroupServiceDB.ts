/**
 * Group Service with Database Integration
 * Handles business logic for group operations using database
 */

import { DatabaseFactory } from '../database/DatabaseFactory';
import { DatabaseAdapter } from '../database/abstract/DatabaseAdapter';
import { Group, GroupDetail, GroupMember, Expense } from '../types';

interface GroupData {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  member_count: number;
  total_expenses: number;
}

interface MemberData {
  id: string;
  name: string;
  email: string;
  joined_at: string;
}

interface ExpenseData {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  split_type: string;
  date: string;
  group_id: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface CreateGroupData {
  name: string;
  description?: string;
  members?: Array<{ id: string; name: string; email: string }>;
}

interface UpdateGroupData {
  name?: string;
  description?: string;
}

interface MemberDataInput {
  id: string;
  name: string;
  email: string;
}

export class GroupServiceDB {
  private db: DatabaseAdapter | null = null;

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    if (!this.db) {
      const factory = DatabaseFactory.getInstance();
      this.db = factory.getDefaultAdapter();
      await this.db.connect();
    }
  }

  /**
   * Get all groups with their members
   */
  async getAllGroups(): Promise<Group[]> {
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

      const groupsResult = await this.db!.query(groupsQuery);
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

        const membersResult = await this.db!.query(membersQuery, [group.id]);
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

        const expensesResult = await this.db!.query(expensesQuery, [group.id]);
        group.expenses = expensesResult.rows || [];

        // Transform the data to match iOS expectations
        group.memberCount = parseInt(group.member_count) || 0;
        group.totalExpenses = parseFloat(group.total_expenses) || 0.0;
        group.createdAt = group.created_at;
        group.updatedAt = group.updated_at;

        // Transform members data
        group.members = group.members.map((member: MemberData) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          joinedAt: member.joined_at
        }));

        // Transform expenses data
        group.expenses = group.expenses.map((expense: ExpenseData) => ({
          id: expense.id,
          title: expense.title,
          amount: parseFloat(expense.amount.toString()),
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

      return groups as Group[];
    } catch (error) {
      throw new Error(`Failed to fetch groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific group by ID with members and expenses
   */
  async getGroupById(groupId: string): Promise<GroupDetail> {
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

      const groupResult = await this.db!.query(groupQuery, [groupId]);
      const group = groupResult.rows && groupResult.rows.length > 0 ? groupResult.rows[0] : null;
      
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

      const membersResult = await this.db!.query(membersQuery, [groupId]);
      group.members = membersResult.rows || [];

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

      const expensesResult = await this.db!.query(expensesQuery, [groupId]);
      group.expenses = expensesResult.rows || [];

      // Transform the data to match iOS expectations
      group.createdAt = group.created_at;
      group.updatedAt = group.updated_at;
      group.memberCount = group.members.length;
      group.totalExpenses = group.expenses.reduce((sum: number, expense: ExpenseData) => sum + parseFloat(expense.amount.toString()), 0);

      // Transform members data
      group.members = group.members.map((member: MemberData) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        joinedAt: member.joined_at
      }));

      // Transform expenses data
      group.expenses = group.expenses.map((expense: ExpenseData) => ({
        id: expense.id,
        title: expense.title,
        amount: parseFloat(expense.amount.toString()),
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

      return group as GroupDetail;
    } catch (error) {
      throw new Error(`Failed to fetch group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new group
   */
  async createGroup(groupData: CreateGroupData): Promise<Group> {
    try {
      await this.initialize();

      const { name, description, members = [] } = groupData;

      if (!name || name.trim() === '') {
        throw new Error('Group name is required');
      }

      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create group using raw SQL
      const groupQuery = `
        INSERT INTO groups (id, name, description, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const now = new Date().toISOString();
      await this.db!.query(groupQuery, [
        groupId,
        name.trim(),
        description || '',
        'unknown',
        now,
        now
      ]);

      // Add members if provided
      for (const member of members) {
        await this.addMemberToGroup(groupId, member);
      }

      return await this.getGroupById(groupId);
    } catch (error) {
      throw new Error(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a group
   */
  async updateGroup(groupId: string, updateData: UpdateGroupData): Promise<Group> {
    try {
      await this.initialize();

      const { name, description } = updateData;

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(name.trim());
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        values.push(description);
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = $${paramCount++}`);
      values.push(new Date().toISOString());
      values.push(groupId);

      const updateQuery = `
        UPDATE groups 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await this.db!.query(updateQuery, values);
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error(`Group with ID ${groupId} not found`);
      }

      return await this.getGroupById(groupId);
    } catch (error) {
      throw new Error(`Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a group
   */
  async deleteGroup(groupId: string): Promise<Group> {
    try {
      await this.initialize();

      const group = await this.getGroupById(groupId);
      
      // Delete group using raw SQL
      await this.db!.query('DELETE FROM groups WHERE id = $1', [groupId]);

      return group;
    } catch (error) {
      throw new Error(`Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a member to a group
   */
  async addMemberToGroup(groupId: string, memberData: MemberDataInput): Promise<Group> {
    try {
      await this.initialize();

      const { id, name, email } = memberData;

      if (!id || !name || !email) {
        throw new Error('Member ID, name, and email are required');
      }

      // Check if member exists, create if not
      const memberQuery = 'SELECT id FROM members WHERE id = $1';
      const memberResult = await this.db!.query(memberQuery, [id]);
      
      if (!memberResult.rows || memberResult.rows.length === 0) {
        const insertMemberQuery = `
          INSERT INTO members (id, name, email, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
        `;
        const now = new Date().toISOString();
        await this.db!.query(insertMemberQuery, [id, name, email, now, now]);
      }

      // Check if member is already in group
      const groupMemberQuery = `
        SELECT id FROM group_members 
        WHERE group_id = $1 AND member_id = $2
      `;
      const groupMemberResult = await this.db!.query(groupMemberQuery, [groupId, id]);

      if (groupMemberResult.rows && groupMemberResult.rows.length > 0) {
        throw new Error('Member is already in this group');
      }

      // Add member to group
      const addMemberQuery = `
        INSERT INTO group_members (group_id, member_id, joined_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
      `;
      const now = new Date().toISOString();
      await this.db!.query(addMemberQuery, [groupId, id, now, now, now]);

      return await this.getGroupById(groupId);
    } catch (error) {
      throw new Error(`Failed to add member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a member from a group
   */
  async removeMemberFromGroup(groupId: string, memberId: string): Promise<Group> {
    try {
      await this.initialize();

      const deleteQuery = `
        DELETE FROM group_members 
        WHERE group_id = $1 AND member_id = $2
        RETURNING *
      `;
      
      const result = await this.db!.query(deleteQuery, [groupId, memberId]);

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Member not found in this group');
      }

      return await this.getGroupById(groupId);
    } catch (error) {
      throw new Error(`Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add an expense to a group
   */
  async addExpenseToGroup(groupId: string, expense: Expense): Promise<Group> {
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
      throw new Error(`Failed to add expense to group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove an expense from a group
   */
  async removeExpenseFromGroup(groupId: string, expenseId: string): Promise<Group> {
    try {
      await this.initialize();

      // This method is called by ExpenseService
      // The expense is already deleted, we just need to verify the group exists
      const group = await this.getGroupById(groupId);
      return group;
    } catch (error) {
      throw new Error(`Failed to remove expense from group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search groups by name or description
   */
  async searchGroups(query: string): Promise<Group[]> {
    try {
      await this.initialize();

      const searchQuery = `
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
        WHERE g.name ILIKE $1 OR g.description ILIKE $1
        ORDER BY g.created_at DESC
      `;

      const result = await this.db!.query(searchQuery, [`%${query}%`]);
      const groups = result.rows || [];

      // Transform the data to match iOS expectations
      for (const group of groups) {
        group.memberCount = parseInt(group.member_count) || 0;
        group.totalExpenses = parseFloat(group.total_expenses) || 0.0;
        group.createdAt = group.created_at;
        group.updatedAt = group.updated_at;
        group.createdBy = group.created_by || 'unknown';

        // Get members for each group
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

        const membersResult = await this.db!.query(membersQuery, [group.id]);
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

        const expensesResult = await this.db!.query(expensesQuery, [group.id]);
        group.expenses = expensesResult.rows || [];

        // Transform members data
        group.members = group.members.map((member: MemberData) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          joinedAt: member.joined_at
        }));

        // Transform expenses data
        group.expenses = group.expenses.map((expense: ExpenseData) => ({
          id: expense.id,
          title: expense.title,
          amount: parseFloat(expense.amount.toString()),
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

      return groups as Group[];
    } catch (error) {
      throw new Error(`Failed to search groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get group statistics
   */
  async getGroupStats(groupId: string): Promise<any> {
    try {
      await this.initialize();

      const statsQuery = `
        SELECT
          COUNT(DISTINCT gm.member_id) as member_count,
          COUNT(e.id) as expense_count,
          COALESCE(SUM(e.amount), 0) as total_amount,
          COALESCE(AVG(e.amount), 0) as average_amount
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN expenses e ON g.id = e.group_id
        WHERE g.id = $1
        GROUP BY g.id
      `;

      const result = await this.db!.query(statsQuery, [groupId]);
      const stats = result.rows && result.rows.length > 0 ? result.rows[0] : {
        member_count: 0,
        expense_count: 0,
        total_amount: 0,
        average_amount: 0
      };

      return {
        memberCount: parseInt(stats.member_count.toString()),
        expenseCount: parseInt(stats.expense_count.toString()),
        totalAmount: parseFloat(stats.total_amount.toString()),
        averageAmount: parseFloat(stats.average_amount.toString())
      };
    } catch (error) {
      throw new Error(`Failed to get group stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get group expenses
   */
  async getGroupExpenses(groupId: string): Promise<Expense[]> {
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

      const result = await this.db!.query(expensesQuery, [groupId]);
      return result.rows || [];
    } catch (error) {
      throw new Error(`Failed to get group expenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default GroupServiceDB;
