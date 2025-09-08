-- Migration: Create group_members table
-- Description: Creates the junction table for group-member relationships

CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    member_id VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_group_members_group_id 
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_member_id 
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate group-member relationships
    CONSTRAINT unique_group_member 
        UNIQUE (group_id, member_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_member_id ON group_members(member_id);
CREATE INDEX IF NOT EXISTS idx_group_members_joined_at ON group_members(joined_at);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_group_members_updated_at 
    BEFORE UPDATE ON group_members 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
