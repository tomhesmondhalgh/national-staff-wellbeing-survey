
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../integrations/supabase/types';

const SUPABASE_URL = "https://bagaaqkmewkuwtudwnqw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2FhcWttZXdrdXd0dWR3bnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjQwMzIsImV4cCI6MjA1NjI0MDAzMn0.Eu_xDUDDk188oE0dB7W7KJ4oWjB6nQNuUBBnZUMrsvE";

// For debugging in development
console.log('Initializing Supabase client with URL:', SUPABASE_URL.substring(0, 8) + '...');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
