/**
 * Expense Service
 * Handles business logic for expense operations
 */

const Expense = require('../models/Expense');

class ExpenseService {
    constructor() {
        // In-memory storage for expenses
        this.expenses = new Map();
        this.initializeSampleData();
    }

    /**
     * Initialize with sample expense data
     */
    initializeSampleData() {
        const sampleExpenses = [
            {
                id: 'expense_1',
                title: 'Dinner at Restaurant',
                amount: 1200.00,
                paidBy: '1', // Rishab
                groupId: '1', // Weekend Trip
                splitType: 'equal',
                date: '2024-09-01T19:30:00.000Z',
                description: 'Group dinner at the new Italian restaurant',
                splitDetails: [
                    { userId: '1', userName: 'Rishab', amount: 300.00, percentage: 25.00 },
                    { userId: '2', userName: 'Sarah', amount: 300.00, percentage: 25.00 },
                    { userId: '3', userName: 'Alex', amount: 300.00, percentage: 25.00 },
                    { userId: '4', userName: 'Emma', amount: 300.00, percentage: 25.00 }
                ]
            },
            {
                id: 'expense_2',
                title: 'Gas for Road Trip',
                amount: 800.00,
                paidBy: '2', // Sarah
                groupId: '1', // Weekend Trip
                splitType: 'equal',
                date: '2024-09-02T08:00:00.000Z',
                description: 'Fuel for the weekend road trip',
                splitDetails: [
                    { userId: '1', userName: 'Rishab', amount: 200.00, percentage: 25.00 },
                    { userId: '2', userName: 'Sarah', amount: 200.00, percentage: 25.00 },
                    { userId: '3', userName: 'Alex', amount: 200.00, percentage: 25.00 },
                    { userId: '4', userName: 'Emma', amount: 200.00, percentage: 25.00 }
                ]
            },
            {
                id: 'expense_3',
                title: 'Office Lunch',
                amount: 450.00,
                paidBy: '5', // John
                groupId: '2', // Office Lunch
                splitType: 'equal',
                date: '2024-09-03T12:30:00.000Z',
                description: 'Team lunch at the office cafeteria',
                splitDetails: [
                    { userId: '5', userName: 'John', amount: 150.00, percentage: 33.33 },
                    { userId: '6', userName: 'Lisa', amount: 150.00, percentage: 33.33 },
                    { userId: '7', userName: 'Mike', amount: 150.00, percentage: 33.34 }
                ]
            }
        ];

        sampleExpenses.forEach(expenseData => {
            const expense = new Expense(expenseData);
            this.expenses.set(expense.id, expense);
        });
    }

    /**
     * Create a new expense
     */
    createExpense(expenseData) {
        try {
            const expense = new Expense(expenseData);
            this.expenses.set(expense.id, expense);
            return expense;
        } catch (error) {
            throw new Error(`Failed to create expense: ${error.message}`);
        }
    }

    /**
     * Get all expenses
     */
    getAllExpenses() {
        return Array.from(this.expenses.values());
    }

    /**
     * Get expenses by group ID
     */
    getExpensesByGroup(groupId) {
        return this.getAllExpenses().filter(expense => expense.groupId === groupId);
    }

    /**
     * Get expense by ID
     */
    getExpenseById(expenseId) {
        const expense = this.expenses.get(expenseId);
        if (!expense) {
            throw new Error(`Expense with ID ${expenseId} not found`);
        }
        return expense;
    }

    /**
     * Update an expense
     */
    updateExpense(expenseId, updateData) {
        const expense = this.getExpenseById(expenseId);
        expense.update(updateData);
        return expense;
    }

    /**
     * Delete an expense
     */
    deleteExpense(expenseId) {
        const expense = this.getExpenseById(expenseId);
        this.expenses.delete(expenseId);
        return expense;
    }

    /**
     * Get expenses by user ID (expenses where user paid or is involved in split)
     */
    getExpensesByUser(userId) {
        return this.getAllExpenses().filter(expense => {
            // Check if user paid for the expense
            if (expense.paidBy === userId) {
                return true;
            }
            
            // Check if user is involved in the split
            return expense.splitDetails.some(split => split.userId === userId);
        });
    }

    /**
     * Get expense statistics for a group
     */
    getGroupExpenseStats(groupId) {
        const groupExpenses = this.getExpensesByGroup(groupId);
        
        const totalAmount = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const expenseCount = groupExpenses.length;
        
        // Calculate who owes what to whom
        const balances = new Map();
        
        groupExpenses.forEach(expense => {
            // Add amount to the person who paid
            const paidBy = expense.paidBy;
            balances.set(paidBy, (balances.get(paidBy) || 0) + expense.amount);
            
            // Subtract amount from each person in the split
            expense.splitDetails.forEach(split => {
                balances.set(split.userId, (balances.get(split.userId) || 0) - split.amount);
            });
        });
        
        return {
            totalAmount,
            expenseCount,
            balances: Object.fromEntries(balances),
            expenses: groupExpenses.map(expense => expense.getSummary())
        };
    }

    /**
     * Calculate equal split for a group
     */
    calculateEqualSplit(groupId, amount, participants) {
        if (!participants || participants.length === 0) {
            throw new Error('Participants list is required');
        }
        
        const amountPerPerson = amount / participants.length;
        
        return participants.map(participant => ({
            userId: participant.id,
            userName: participant.name,
            amount: Math.round(amountPerPerson * 100) / 100,
            percentage: Math.round((100 / participants.length) * 100) / 100
        }));
    }

    /**
     * Validate expense data before creation
     */
    validateExpenseData(expenseData) {
        const errors = [];
        
        if (!expenseData.title || expenseData.title.trim() === '') {
            errors.push('Title is required');
        }
        
        if (!expenseData.amount || isNaN(expenseData.amount) || parseFloat(expenseData.amount) <= 0) {
            errors.push('Amount must be a positive number');
        }
        
        if (!expenseData.paidBy || expenseData.paidBy.trim() === '') {
            errors.push('Paid by user ID is required');
        }
        
        if (!expenseData.groupId || expenseData.groupId.trim() === '') {
            errors.push('Group ID is required');
        }
        
        if (expenseData.splitType && !['equal', 'exact', 'percentage'].includes(expenseData.splitType)) {
            errors.push('Invalid split type. Must be equal, exact, or percentage');
        }
        
        return errors;
    }
}

module.exports = ExpenseService;
