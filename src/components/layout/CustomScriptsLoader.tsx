
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CustomScriptsLoader = () => {
  const [scriptContent, setScriptContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const { data, error } = await supabase
          .from('custom_scripts')
          .select('script_content')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching custom scripts:', error);
        } else if (data && data.script_content) {
          setScriptContent(data.script_content);
        }
      } catch (err) {
        console.error('Unexpected error loading scripts:', err);
      }
    };

    fetchScripts();
    
    // Fetch scripts every minute to check for updates
    const interval = setInterval(fetchScripts, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // If no script content is available, render nothing
  if (!scriptContent) return null;

  // Use dangerouslySetInnerHTML to inject the custom scripts
  return <div dangerouslySetInnerHTML={{ __html: scriptContent }} />;
};

export default CustomScriptsLoader;
