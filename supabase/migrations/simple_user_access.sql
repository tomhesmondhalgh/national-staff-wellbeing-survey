
-- This migration simplifies the RLS policies to use a direct user ID check
-- without any complex role-based permissions

-- Change survey_templates policies to simple user-based access
DROP POLICY IF EXISTS "Users can view their own surveys" ON survey_templates;
CREATE POLICY "Users can view their own surveys" 
ON survey_templates 
FOR SELECT 
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can insert their own surveys" ON survey_templates;
CREATE POLICY "Users can insert their own surveys" 
ON survey_templates 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update their own surveys" ON survey_templates;
CREATE POLICY "Users can update their own surveys" 
ON survey_templates 
FOR UPDATE 
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete their own surveys" ON survey_templates;
CREATE POLICY "Users can delete their own surveys" 
ON survey_templates 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Set similar policies for action_plan_descriptors
DROP POLICY IF EXISTS "Users can view their own action plans" ON action_plan_descriptors;
CREATE POLICY "Users can view their own action plans" 
ON action_plan_descriptors 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own action plans" ON action_plan_descriptors;
CREATE POLICY "Users can insert their own action plans" 
ON action_plan_descriptors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own action plans" ON action_plan_descriptors;
CREATE POLICY "Users can update their own action plans" 
ON action_plan_descriptors 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own action plans" ON action_plan_descriptors;
CREATE POLICY "Users can delete their own action plans" 
ON action_plan_descriptors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Apply same pattern to survey_responses
DROP POLICY IF EXISTS "Users can view responses for their surveys" ON survey_responses;
CREATE POLICY "Users can view responses for their surveys" 
ON survey_responses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM survey_templates 
  WHERE survey_templates.id = survey_responses.survey_template_id 
  AND survey_templates.creator_id = auth.uid()
));

-- Update profile RLS to only allow users to see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id);
