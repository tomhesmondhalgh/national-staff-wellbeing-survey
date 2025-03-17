import React, { useState, useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CustomScriptsManagement = () => {
  const [scriptContent, setScriptContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing script content on component mount
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('custom_scripts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine for new setups
          console.error('Error fetching custom scripts:', error);
          setError('Failed to load existing scripts. Please try again.');
        } else if (data) {
          setScriptContent(data.script_content || '');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred while loading scripts.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScripts();
  }, []);

  const handleSaveScripts = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);
      
      // Insert new script record (we're keeping a history by always creating new records)
      const { error } = await supabase
        .from('custom_scripts')
        .insert({
          script_content: scriptContent,
          is_active: true
        });
      
      if (error) {
        console.error('Error saving custom scripts:', error);
        setError('Failed to save scripts. Please try again.');
        toast.error('Failed to save custom scripts');
        return;
      }
      
      setSaveSuccess(true);
      toast.success('Custom scripts saved successfully');
      
      // Success feedback disappears after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred while saving scripts.');
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Custom Scripts</h2>
        
        <p className="text-gray-600 mb-4">
          Add custom JavaScript or HTML snippets that will be injected into all pages of your website.
          This is useful for analytics tracking, chat widgets, or other third-party integrations.
        </p>
        
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <p className="font-medium">Use with caution:</p>
            <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
              <li>Only add scripts from trusted sources</li>
              <li>Invalid scripts may affect site functionality</li>
              <li>Test thoroughly after adding new scripts</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="customScripts" className="block text-sm font-medium text-gray-700 mb-2">
              Script Content
            </label>
            <Textarea
              id="customScripts"
              placeholder='<!-- Paste your script tags here -->\n<script>\n  // Or your JavaScript code here\n</script>'
              className="h-60 font-mono text-sm"
              value={scriptContent}
              onChange={(e) => setScriptContent(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Include complete script tags like &lt;script&gt;...&lt;/script&gt; or tracking pixels.
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end">
            <Button
              onClick={handleSaveScripts}
              disabled={isSaving}
              className={saveSuccess ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Scripts
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-3">Implementation Notes</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• Scripts are added to all pages in your application</li>
          <li>• Changes may take up to 1 minute to propagate</li>
          <li>• For testing, clear your browser cache after saving</li>
          <li>• Some third-party scripts may require additional configuration</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomScriptsManagement;
