// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bagaaqkmewkuwtudwnqw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2FhcWttZXdrdXd0dWR3bnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjQwMzIsImV4cCI6MjA1NjI0MDAzMn0.Eu_xDUDDk188oE0dB7W7KJ4oWjB6nQNuUBBnZUMrsvE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);