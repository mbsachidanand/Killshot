/**
 * Expense Model
 * Represents an expense record in the Killshot app
 */

class Expense {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.title = data.title;
        this.amount = parseFloat(data.amount);
        this.paidBy = data.paidBy; // User ID who paid
        this.groupId = data.groupId;
        this.splitType = data.splitType || 'equal'; // 'equal', 'exact', 'percentage'
        this.splitDetails = data.splitDetails || []; // Array of split information
        this.date = data.date || new Date().toISOString();
        this.description = data.description || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        
        // Validate required fields
        this.validate();
    }

    /**
     * Generate a unique ID for the expense
     */
    generateId() {
        return 'expense_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Validate expense data
     */
    validate() {
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
     */
    calculateEqualSplit(participants) {
        if (!participants || participants.length === 0) {
            throw new Error('Participants list is required for equal split');
        }
        
        const amountPerPerson = this.amount / participants.length;
        this.splitDetails = participants.map(participant => ({
            userId: participant.id,
            userName: participant.name,
            amount: Math.round(amountPerPerson * 100) / 100, // Round to 2 decimal places
            percentage: Math.round((100 / participants.length) * 100) / 100
        }));
        
        return this.splitDetails;
    }

    /**
     * Set exact split amounts
     */
    setExactSplit(splitDetails) {
        if (!splitDetails || !Array.isArray(splitDetails)) {
            throw new Error('Split details must be an array');
        }
        
        const totalAmount = splitDetails.reduce((sum, split) => sum + parseFloat(split.amount), 0);
        
        if (Math.abs(totalAmount - this.amount) > 0.01) { // Allow for small rounding differences
            throw new Error(`Total split amount (${totalAmount}) must equal expense amount (${this.amount})`);
        }
        
        this.splitDetails = splitDetails.map(split => ({
            userId: split.userId,
            userName: split.userName,
            amount: parseFloat(split.amount),
            percentage: Math.round((parseFloat(split.amount) / this.amount) * 100 * 100) / 100
        }));
        
        return this.splitDetails;
    }

    /**
     * Set percentage-based split
     */
    setPercentageSplit(splitDetails) {
        if (!splitDetails || !Array.isArray(splitDetails)) {
            throw new Error('Split details must be an array');
        }
        
        const totalPercentage = splitDetails.reduce((sum, split) => sum + parseFloat(split.percentage), 0);
        
        if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for small rounding differences
            throw new Error(`Total percentage (${totalPercentage}%) must equal 100%`);
        }
        
        this.splitDetails = splitDetails.map(split => ({
            userId: split.userId,
            userName: split.userName,
            amount: Math.round((this.amount * parseFloat(split.percentage) / 100) * 100) / 100,
            percentage: parseFloat(split.percentage)
        }));
        
        return this.splitDetails;
    }

    /**
     * Update expense data
     */
    update(data) {
        if (data.title !== undefined) this.title = data.title;
        if (data.amount !== undefined) this.amount = parseFloat(data.amount);
        if (data.paidBy !== undefined) this.paidBy = data.paidBy;
        if (data.splitType !== undefined) this.splitType = data.splitType;
        if (data.splitDetails !== undefined) this.splitDetails = data.splitDetails;
        if (data.description !== undefined) this.description = data.description;
        if (data.date !== undefined) this.date = data.date;
        
        this.updatedAt = new Date().toISOString();
        this.validate();
    }

    /**
     * Get expense summary
     */
    getSummary() {
        return {
            id: this.id,
            title: this.title,
            amount: this.amount,
            paidBy: this.paidBy,
            groupId: this.groupId,
            splitType: this.splitType,
            date: this.date,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Convert to JSON format for API responses
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            amount: this.amount,
            paidBy: this.paidBy,
            groupId: this.groupId,
            splitType: this.splitType,
            splitDetails: this.splitDetails,
            date: this.date,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Expense;
