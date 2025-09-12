/**
 * Expense Model
 * Represents an expense record in the Killshot app
 *
 * @fileoverview TypeScript implementation of the Expense model with full type safety
 */

import { DatabaseEntity, Expense as ExpenseType, SplitDetail } from '@/types';

/**
 * Split type enumeration
 */
export type SplitType = 'equal' | 'exact' | 'percentage';

/**
 * Participant interface for split calculations
 */
export interface Participant {
  id: string;
  name: string;
  email?: string;
}

/**
 * Split detail for calculations
 */
export interface SplitCalculation {
  userId: string;
  userName: string;
  amount: number;
  percentage: number;
}

/**
 * Expense Model Class
 *
 * This class represents an expense in the expense splitting application.
 * It provides methods for managing expense data and calculating splits with full type safety.
 */
export class Expense implements ExpenseType, DatabaseEntity {
  public readonly id: string;
  public title: string;
  public amount: number;
  public paidBy: string;
  public groupId: string;
  public splitType: SplitType;
  public splits: SplitDetail[];
  public date: Date;
  public description: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  /**
   * Constructor for Expense
   *
   * @param data - Expense data object
   * @throws {Error} If required data is missing or invalid
   */
  constructor(data: {
    id?: string;
    title: string;
    amount: number;
    paidBy: string;
    groupId: string;
    splitType?: SplitType;
    splits?: SplitDetail[];
    date?: string | Date;
    description?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }) {
    this.id = data.id || this.generateId();
    this.title = data.title;
    this.amount = parseFloat(data.amount.toString());
    this.paidBy = data.paidBy;
    this.groupId = data.groupId;
    this.splitType = data.splitType || 'equal';
    this.splits = data.splits || [];
    this.date = data.date ? new Date(data.date) : new Date();
    this.description = data.description || '';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

    // Validate required fields
    this.validate();
  }

  /**
   * Generate a unique ID for the expense
   *
   * @returns {string} Unique expense ID
   */
  private generateId(): string {
    return `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate expense data
   *
   * @throws {Error} If expense data is invalid
   */
  private validate(): void {
    if (!this.title || this.title.trim() === '') {
      throw new Error('Expense title is required');
    }

    if (!this.amount || isNaN(this.amount) || this.amount <= 0) {
      throw new Error('Expense amount must be a positive number');
    }

    if (!this.paidBy || this.paidBy.trim() === '') {
      throw new Error('Paid by user ID is required');
    }

    if (!this.groupId || this.groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    if (!['equal', 'exact', 'percentage'].includes(this.splitType)) {
      throw new Error('Invalid split type. Must be equal, exact, or percentage');
    }
  }

  /**
   * Calculate equal split among participants
   *
   * @param participants - Array of participants
   * @returns {SplitDetail[]} Array of split details
   * @throws {Error} If participants list is empty or invalid
   */
  public calculateEqualSplit(participants: Participant[]): SplitDetail[] {
    if (!participants || participants.length === 0) {
      throw new Error('Participants list is required for equal split');
    }

    const amountPerPerson = this.amount / participants.length;
    const percentagePerPerson = 100 / participants.length;

    this.splits = participants.map(participant => ({
      id: `split_${this.id}_${participant.id}`,
      expenseId: this.id,
      userId: participant.id,
      amount: Math.round(amountPerPerson * 100) / 100, // Round to 2 decimal places
      isPaid: false,
      paidAt: undefined as Date | undefined
    }));

    this.updatedAt = new Date();
    return this.splits;
  }

  /**
   * Set exact split amounts
   *
   * @param splitDetails - Array of exact split amounts
   * @returns {SplitDetail[]} Array of split details
   * @throws {Error} If split amounts don't match expense amount
   */
  public setExactSplit(splitDetails: { userId: string; amount: number }[]): SplitDetail[] {
    if (!splitDetails || !Array.isArray(splitDetails)) {
      throw new Error('Split details must be an array');
    }

    const totalAmount = splitDetails.reduce((sum, split) => sum + parseFloat(split.amount.toString()), 0);

    if (Math.abs(totalAmount - this.amount) > 0.01) { // Allow for small rounding differences
      throw new Error(`Total split amount (${totalAmount}) must equal expense amount (${this.amount})`);
    }

    this.splits = splitDetails.map(split => ({
      id: `split_${this.id}_${split.userId}`,
      expenseId: this.id,
      userId: split.userId,
      amount: parseFloat(split.amount.toString()),
      isPaid: false,
      paidAt: undefined
    }));

    this.updatedAt = new Date();
    return this.splits;
  }

  /**
   * Set percentage-based split
   *
   * @param splitDetails - Array of percentage splits
   * @returns {SplitDetail[]} Array of split details
   * @throws {Error} If percentages don't add up to 100%
   */
  public setPercentageSplit(splitDetails: { userId: string; percentage: number }[]): SplitDetail[] {
    if (!splitDetails || !Array.isArray(splitDetails)) {
      throw new Error('Split details must be an array');
    }

    const totalPercentage = splitDetails.reduce((sum, split) => sum + parseFloat(split.percentage.toString()), 0);

    if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for small rounding differences
      throw new Error(`Total percentage (${totalPercentage}%) must equal 100%`);
    }

    this.splits = splitDetails.map(split => ({
      id: `split_${this.id}_${split.userId}`,
      expenseId: this.id,
      userId: split.userId,
      amount: Math.round((this.amount * parseFloat(split.percentage.toString()) / 100) * 100) / 100,
      isPaid: false,
      paidAt: undefined
    }));

    this.updatedAt = new Date();
    return this.splits;
  }

  /**
   * Update expense data
   *
   * @param data - Partial expense data to update
   * @throws {Error} If updated data is invalid
   */
  public update(data: Partial<{
    title: string;
    amount: number;
    paidBy: string;
    splitType: SplitType;
    splits: SplitDetail[];
    description: string;
    date: string | Date;
  }>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.amount !== undefined) this.amount = parseFloat(data.amount.toString());
    if (data.paidBy !== undefined) this.paidBy = data.paidBy;
    if (data.splitType !== undefined) this.splitType = data.splitType;
    if (data.splits !== undefined) this.splits = data.splits;
    if (data.description !== undefined) this.description = data.description;
    if (data.date !== undefined) this.date = new Date(data.date);

    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Mark a split as paid
   *
   * @param userId - User ID whose split to mark as paid
   * @returns {boolean} True if split was found and marked as paid
   */
  public markSplitAsPaid(userId: string): boolean {
    const split = this.splits.find(s => s.userId === userId);
    if (split) {
      split.isPaid = true;
      split.paidAt = new Date();
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get total amount paid by splits
   *
   * @returns {number} Total amount paid
   */
  public getTotalPaid(): number {
    return this.splits
      .filter(split => split.isPaid)
      .reduce((sum, split) => sum + split.amount, 0);
  }

  /**
   * Get remaining amount to be paid
   *
   * @returns {number} Remaining amount
   */
  public getRemainingAmount(): number {
    return this.amount - this.getTotalPaid();
  }

  /**
   * Check if expense is fully paid
   *
   * @returns {boolean} True if all splits are paid
   */
  public isFullyPaid(): boolean {
    return this.splits.every(split => split.isPaid);
  }

  /**
   * Get expense summary
   *
   * @returns {Object} Expense summary
   */
  public getSummary(): {
    id: string;
    title: string;
    amount: number;
    paidBy: string;
    groupId: string;
    splitType: SplitType;
    date: Date;
    description: string;
    totalPaid: number;
    remainingAmount: number;
    isFullyPaid: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      title: this.title,
      amount: this.amount,
      paidBy: this.paidBy,
      groupId: this.groupId,
      splitType: this.splitType,
      date: this.date,
      description: this.description,
      totalPaid: this.getTotalPaid(),
      remainingAmount: this.getRemainingAmount(),
      isFullyPaid: this.isFullyPaid(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Convert to JSON format for API responses
   *
   * @returns {ExpenseType} JSON representation of the expense
   */
  public toJSON(): ExpenseType {
    return {
      id: this.id,
      groupId: this.groupId,
      title: this.title,
      amount: this.amount,
      description: this.description,
      paidBy: this.paidBy,
      splitType: this.splitType,
      date: this.date,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      splits: this.splits
    };
  }

  /**
   * Create a new Expense instance from JSON data
   *
   * @param data - JSON data to create expense from
   * @returns {Expense} New Expense instance
   * @throws {Error} If required data is missing
   */
  public static fromJSON(data: Partial<ExpenseType>): Expense {
    if (!data.title || !data.amount || !data.paidBy || !data.groupId) {
      throw new Error('Expense data must include title, amount, paidBy, and groupId');
    }

    return new Expense({
      id: data.id,
      title: data.title,
      amount: data.amount,
      paidBy: data.paidBy,
      groupId: data.groupId,
      splitType: data.splitType || 'equal',
      splits: data.splits || [],
      date: data.date,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });
  }

  /**
   * Validate expense data
   *
   * @param data - Data to validate
   * @returns {boolean} True if data is valid
   * @throws {Error} If data is invalid
   */
  public static validate(data: Partial<ExpenseType>): boolean {
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Expense must have a valid string title');
    }

    if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
      throw new Error('Expense must have a positive number amount');
    }

    if (!data.paidBy || typeof data.paidBy !== 'string') {
      throw new Error('Expense must have a valid string paidBy');
    }

    if (!data.groupId || typeof data.groupId !== 'string') {
      throw new Error('Expense must have a valid string groupId');
    }

    if (data.splitType && !['equal', 'exact', 'percentage'].includes(data.splitType)) {
      throw new Error('Expense splitType must be equal, exact, or percentage');
    }

    return true;
  }
}

export default Expense;
