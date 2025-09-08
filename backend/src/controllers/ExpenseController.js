/**
 * Expense Controller
 * Handles HTTP requests for expense operations
 */

const ExpenseService = require('../services/ExpenseService');
const GroupService = require('../services/GroupService');

class ExpenseController {
    constructor() {
        this.expenseService = new ExpenseService();
        this.groupService = new GroupService();
    }

    /**
     * Create a new expense
     * POST /api/v1/expenses
     */
    createExpense = async (req, res) => {
        try {
            const { title, amount, paidBy, groupId, splitType, date, description } = req.body;

            // Validate required fields
            const validationErrors = this.expenseService.validateExpenseData(req.body);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            // Check if group exists
            try {
                const group = this.groupService.getGroupById(groupId);
                
                // Get group members for split calculation
                const participants = group.members;
                
                // Create expense data
                const expenseData = {
                    title,
                    amount: parseFloat(amount),
                    paidBy,
                    groupId,
                    splitType: splitType || 'equal',
                    date: date || new Date().toISOString(),
                    description: description || ''
                };

                // Calculate split based on type
                if (expenseData.splitType === 'equal') {
                    expenseData.splitDetails = this.expenseService.calculateEqualSplit(
                        groupId, 
                        expenseData.amount, 
                        participants
                    );
                } else {
                    // For exact and percentage splits, we'll need the split details from the request
                    const { splitDetails } = req.body;
                    if (!splitDetails || !Array.isArray(splitDetails)) {
                        return res.status(400).json({
                            success: false,
                            message: 'Split details are required for exact and percentage splits'
                        });
                    }
                    expenseData.splitDetails = splitDetails;
                }

                // Create the expense
                const expense = this.expenseService.createExpense(expenseData);

                // Add expense to the group
                this.groupService.addExpenseToGroup(groupId, expense);

                res.status(201).json({
                    success: true,
                    message: 'Expense created successfully',
                    data: expense.toJSON()
                });

            } catch (groupError) {
                return res.status(404).json({
                    success: false,
                    message: `Group not found: ${groupError.message}`
                });
            }

        } catch (error) {
            console.error('Error creating expense:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    };

    /**
     * Get all expenses
     * GET /api/v1/expenses
     */
    getAllExpenses = async (req, res) => {
        try {
            const expenses = this.expenseService.getAllExpenses();
            
            res.status(200).json({
                success: true,
                message: 'Expenses retrieved successfully',
                data: expenses.map(expense => expense.toJSON())
            });
        } catch (error) {
            console.error('Error retrieving expenses:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    };

    /**
     * Get expenses by group ID
     * GET /api/v1/expenses/group/:groupId
     */
    getExpensesByGroup = async (req, res) => {
        try {
            const { groupId } = req.params;
            const expenses = this.expenseService.getExpensesByGroup(groupId);
            
            res.status(200).json({
                success: true,
                message: 'Group expenses retrieved successfully',
                data: expenses.map(expense => expense.toJSON())
            });
        } catch (error) {
            console.error('Error retrieving group expenses:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    };

    /**
     * Get expense by ID
     * GET /api/v1/expenses/:id
     */
    getExpenseById = async (req, res) => {
        try {
            const { id } = req.params;
            const expense = this.expenseService.getExpenseById(id);
            
            res.status(200).json({
                success: true,
                message: 'Expense retrieved successfully',
                data: expense.toJSON()
            });
        } catch (error) {
            console.error('Error retrieving expense:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message
                });
            }
        }
    };

    /**
     * Update an expense
     * PUT /api/v1/expenses/:id
     */
    updateExpense = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate update data
            const validationErrors = this.expenseService.validateExpenseData(updateData);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            const expense = this.expenseService.updateExpense(id, updateData);
            
            res.status(200).json({
                success: true,
                message: 'Expense updated successfully',
                data: expense.toJSON()
            });
        } catch (error) {
            console.error('Error updating expense:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message
                });
            }
        }
    };

    /**
     * Delete an expense
     * DELETE /api/v1/expenses/:id
     */
    deleteExpense = async (req, res) => {
        try {
            const { id } = req.params;
            const expense = this.expenseService.deleteExpense(id);
            
            // Remove expense from the group
            this.groupService.removeExpenseFromGroup(expense.groupId, id);
            
            res.status(200).json({
                success: true,
                message: 'Expense deleted successfully',
                data: expense.toJSON()
            });
        } catch (error) {
            console.error('Error deleting expense:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message
            });
            }
        }
    };

    /**
     * Get expenses by user ID
     * GET /api/v1/expenses/user/:userId
     */
    getExpensesByUser = async (req, res) => {
        try {
            const { userId } = req.params;
            const expenses = this.expenseService.getExpensesByUser(userId);
            
            res.status(200).json({
                success: true,
                message: 'User expenses retrieved successfully',
                data: expenses.map(expense => expense.toJSON())
            });
        } catch (error) {
            console.error('Error retrieving user expenses:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    };

    /**
     * Get expense statistics for a group
     * GET /api/v1/expenses/group/:groupId/stats
     */
    getGroupExpenseStats = async (req, res) => {
        try {
            const { groupId } = req.params;
            const stats = this.expenseService.getGroupExpenseStats(groupId);
            
            res.status(200).json({
                success: true,
                message: 'Group expense statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Error retrieving group expense stats:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    };

    /**
     * Calculate equal split for a group
     * POST /api/v1/expenses/calculate-split
     */
    calculateSplit = async (req, res) => {
        try {
            const { groupId, amount, splitType } = req.body;

            if (!groupId || !amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Group ID and amount are required'
                });
            }

            // Get group and its members
            const group = this.groupService.getGroupById(groupId);
            const participants = group.members;

            let splitDetails;
            if (splitType === 'equal') {
                splitDetails = this.expenseService.calculateEqualSplit(groupId, parseFloat(amount), participants);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Only equal split calculation is supported via this endpoint'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Split calculated successfully',
                data: {
                    groupId,
                    amount: parseFloat(amount),
                    splitType,
                    splitDetails
                }
            });
        } catch (error) {
            console.error('Error calculating split:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message
                });
            }
        }
    };
}

module.exports = ExpenseController;
