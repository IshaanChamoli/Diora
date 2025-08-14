-- Add questions_done column to projects table
ALTER TABLE projects ADD COLUMN questions_done BOOLEAN DEFAULT FALSE;

-- Update any existing projects to have questions_done = false
UPDATE projects SET questions_done = FALSE WHERE questions_done IS NULL;

-- Add index for better query performance
CREATE INDEX idx_projects_questions_done ON projects(questions_done);