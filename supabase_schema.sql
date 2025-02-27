
-- Note: Run these SQL commands in your Supabase SQL editor

-- Create the surveys table
CREATE TABLE surveys (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  date DATE NOT NULL,
  close_date DATE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('Scheduled', 'Sent', 'Completed')),
  response_count INTEGER DEFAULT 0,
  url VARCHAR NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the survey responses table
CREATE TABLE survey_responses (
  id BIGSERIAL PRIMARY KEY,
  survey_id BIGINT REFERENCES surveys(id) ON DELETE CASCADE,
  responses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_surveys_user_id ON surveys(user_id);
CREATE INDEX idx_survey_responses_survey_id ON survey_responses(survey_id);

-- Set up Row Level Security (RLS) policies

-- Enable RLS on the tables
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Create a policy for the surveys table that allows users to select only their own surveys
CREATE POLICY surveys_select_policy ON surveys 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create a policy for the surveys table that allows users to insert their own surveys
CREATE POLICY surveys_insert_policy ON surveys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create a policy for the surveys table that allows users to update only their own surveys
CREATE POLICY surveys_update_policy ON surveys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create a policy for the surveys table that allows users to delete only their own surveys
CREATE POLICY surveys_delete_policy ON surveys 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a policy for the survey_responses table that allows all authenticated users to insert
CREATE POLICY survey_responses_insert_policy ON survey_responses 
  FOR INSERT 
  WITH CHECK (true);

-- Create a policy for the survey_responses table that allows users to select responses only for their own surveys
CREATE POLICY survey_responses_select_policy ON survey_responses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM surveys 
      WHERE surveys.id = survey_responses.survey_id 
      AND surveys.user_id = auth.uid()
    )
  );
