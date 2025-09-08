/**
 * Group Model
 * Represents a group in the expense splitting app
 */

class Group {
  constructor(id, name, description = '', createdAt = new Date(), updatedAt = new Date()) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.members = [];
    this.expenses = [];
  }

  /**
   * Add a member to the group
   * @param {Object} member - Member object with id, name, email
   */
  addMember(member) {
    if (!this.members.find(m => m.id === member.id)) {
      this.members.push({
        id: member.id,
        name: member.name,
        email: member.email,
        joinedAt: new Date()
      });
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a member from the group
   * @param {string} memberId - ID of the member to remove
   */
  removeMember(memberId) {
    this.members = this.members.filter(m => m.id !== memberId);
    this.updatedAt = new Date();
  }

  /**
   * Add an expense to the group
   * @param {Object} expense - Expense object
   */
  addExpense(expense) {
    this.expenses.push(expense);
    this.updatedAt = new Date();
  }

  /**
   * Get group summary
   * @returns {Object} Group summary with member count and total expenses
   */
  getSummary() {
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
   * Convert to JSON object
   * @returns {Object} JSON representation of the group
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      members: this.members,
      expenses: this.expenses,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Group;
