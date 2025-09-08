-- Migration: Create expense_splits table
-- Description: Creates the expense_splits table for expense split details

CREATE TABLE IF NOT EXISTS expense_splits (
    id SERIAL PRIMARY KEY,
    expense_id VARCHAR(255) NOT NULL,
    member_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_expense_splits_expense_id 
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_splits_member_id 
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate expense-member splits
    CONSTRAINT unique_expense_member_split 
        UNIQUE (expense_id, member_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id ON expense_splits(member_id);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_expense_splits_updated_at 
    BEFORE UPDATE ON expense_splits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
