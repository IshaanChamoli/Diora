-- Add rank column to experts table to maintain order
ALTER TABLE experts ADD COLUMN rank INTEGER;

-- Add index for rank-based queries  
CREATE INDEX idx_experts_rank ON experts(project_id, for_query, rank);

-- If you haven't created the table yet, use this complete version:
/*
CREATE TABLE experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    linkedin_url TEXT,
    headline TEXT,
    summary TEXT,
    reasoning TEXT,
    for_query TEXT NOT NULL,
    rank INTEGER NOT NULL,
    raw_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_experts_project_id ON experts(project_id);
CREATE INDEX idx_experts_name ON experts(name);
CREATE INDEX idx_experts_for_query ON experts(for_query);
CREATE INDEX idx_experts_linkedin_url ON experts(linkedin_url);
CREATE INDEX idx_experts_rank ON experts(project_id, for_query, rank);

-- Add RLS (Row Level Security)
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view experts for their own projects" ON experts
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE investor_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert experts for their own projects" ON experts
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE investor_id = auth.uid()
        )
    );

CREATE POLICY "Users can update experts for their own projects" ON experts
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE investor_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete experts for their own projects" ON experts
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE investor_id = auth.uid()
        )
    );
*/