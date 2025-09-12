/**
 * Group Model
 * Represents a group in the expense splitting app
 *
 * @fileoverview TypeScript implementation of the Group model with full type safety
 */

import { DatabaseEntity, Expense, GroupMember, Group as GroupType } from '@/types';

/**
 * Group Model Class
 *
 * This class represents a group in the expense splitting application.
 * It provides methods for managing group members and expenses with full type safety.
 */
export class Group implements GroupType, DatabaseEntity {
  public readonly id: string;
  public name: string;
  public description: string;
  public createdBy: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public members: GroupMember[];
  public expenses: Expense[];
  public totalExpenses: number;
  public memberCount: number;

  /**
   * Constructor for Group
   *
   * @param id - Unique identifier for the group
   * @param name - Name of the group
   * @param description - Optional description of the group
   * @param createdAt - Creation timestamp (defaults to current time)
   * @param updatedAt - Last update timestamp (defaults to current time)
   */
  constructor(
    id: string,
    name: string,
    description: string = '',
    createdBy: string = 'system',
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.members = [];
    this.expenses = [];
    this.totalExpenses = 0;
    this.memberCount = 0;
  }

  /**
   * Add a member to the group
   *
   * @param member - Member object with id, name, and email
   * @throws {Error} If member data is invalid
   */
  public addMember(member: {
    id: string;
    name: string;
    email: string;
  }): void {
    // Validate member data
    if (!member.id || !member.name || !member.email) {
      throw new Error('Member must have id, name, and email');
    }

    // Check if member already exists
    if (!this.members.find(m => m.id === member.id)) {
      const newMember: GroupMember = {
        id: member.id,
        groupId: this.id,
        userId: member.id,
        name: member.name,
        email: member.email,
        joinedAt: new Date()
      };

      this.members.push(newMember);
      this.memberCount = this.members.length;
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a member from the group
   *
   * @param memberId - ID of the member to remove
   * @returns {boolean} True if member was removed, false if not found
   */
  public removeMember(memberId: string): boolean {
    const initialLength = this.members.length;
    this.members = this.members.filter(m => m.id !== memberId);

    if (this.members.length < initialLength) {
      this.memberCount = this.members.length;
      this.updatedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * Add an expense to the group
   *
   * @param expense - Expense object to add
   * @throws {Error} If expense data is invalid
   */
  public addExpense(expense: Expense): void {
    // Validate expense data
    if (!expense.id || !expense.title || expense.amount <= 0) {
      throw new Error('Expense must have valid id, title, and positive amount');
    }

    this.expenses.push(expense);
    this.totalExpenses = this.getTotalExpenses();
    this.updatedAt = new Date();
  }

  /**
   * Remove an expense from the group
   *
   * @param expenseId - ID of the expense to remove
   * @returns {boolean} True if expense was removed, false if not found
   */
  public removeExpense(expenseId: string): boolean {
    const initialLength = this.expenses.length;
    this.expenses = this.expenses.filter(expense => expense.id !== expenseId);

    if (this.expenses.length < initialLength) {
      this.totalExpenses = this.getTotalExpenses();
      this.updatedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * Get expense by ID
   *
   * @param expenseId - ID of the expense to find
   * @returns {Expense | null} Expense object or null if not found
   */
  public getExpenseById(expenseId: string): Expense | null {
    return this.expenses.find(expense => expense.id === expenseId) || null;
  }

  /**
   * Get member by ID
   *
   * @param memberId - ID of the member to find
   * @returns {GroupMember | null} Member object or null if not found
   */
  public getMemberById(memberId: string): GroupMember | null {
    return this.members.find(member => member.id === memberId) || null;
  }

  /**
   * Get group summary with calculated values
   *
   * @returns {Object} Group summary with member count and total expenses
   */
  public getSummary(): {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    totalExpenses: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalMembers = this.members.length;

    return {
      id: this.id,
      name: this.name,
      description: this.description,
      memberCount: totalMembers,
      totalExpenses: totalExpenses,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Get total expenses amount
   *
   * @returns {number} Total amount of all expenses in the group
   */
  public getTotalExpenses(): number {
    return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  /**
   * Get member count
   *
   * @returns {number} Number of members in the group
   */
  public getMemberCount(): number {
    return this.members.length;
  }

  /**
   * Check if group has members
   *
   * @returns {boolean} True if group has members, false otherwise
   */
  public hasMembers(): boolean {
    return this.members.length > 0;
  }

  /**
   * Check if group has expenses
   *
   * @returns {boolean} True if group has expenses, false otherwise
   */
  public hasExpenses(): boolean {
    return this.expenses.length > 0;
  }

  /**
   * Convert to JSON object
   *
   * @returns {GroupType} JSON representation of the group
   */
  public toJSON(): GroupType {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      members: this.members,
      expenses: this.expenses,
      totalExpenses: this.getTotalExpenses(),
      memberCount: this.getMemberCount(),
      createdBy: 'system', // Default value for now
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a new Group instance from JSON data
   *
   * @param data - JSON data to create group from
   * @returns {Group} New Group instance
   */
  public static fromJSON(data: Partial<GroupType>): Group {
    if (!data.id || !data.name) {
      throw new Error('Group data must include id and name');
    }

    const group = new Group(
      data.id,
      data.name,
      data.description || '',
      data.createdBy || 'system',
      data.createdAt ? new Date(data.createdAt as any) : new Date(),
      data.updatedAt ? new Date(data.updatedAt) : new Date()
    );

    // Add members if provided
    if (data.members) {
      group.members = data.members;
    }

    // Add expenses if provided
    if (data.expenses) {
      group.expenses = data.expenses;
    }

    return group;
  }

  /**
   * Validate group data
   *
   * @param data - Data to validate
   * @returns {boolean} True if data is valid
   * @throws {Error} If data is invalid
   */
  public static validate(data: Partial<GroupType>): boolean {
    if (!data.id || typeof data.id !== 'string') {
      throw new Error('Group must have a valid string id');
    }

    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Group must have a valid string name');
    }

    if (data.description && typeof data.description !== 'string') {
      throw new Error('Group description must be a string');
    }

    return true;
  }
}

export default Group;
