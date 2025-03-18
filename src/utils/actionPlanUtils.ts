
import { supabase } from "../lib/supabase";
import { ActionPlanDescriptor, DescriptorStatus, ProgressNote } from '../types/actionPlan';

// In utils/actionPlanUtils.ts, let's fix the count property issue and add the missing functions
export const getActionPlanNoteCount = async (descriptorId: string) => {
  try {
    const { count, error } = await supabase
      .from('action_plan_progress_notes')
      .select('*', { count: 'exact', head: true } as { count: 'exact', head: true });
    
    if (error) {
      console.error('Error fetching note count:', error);
      return 0;
    }
    
    // Return count from the query
    return count || 0;
  } catch (error) {
    console.error('Error in getActionPlanNoteCount:', error);
    return 0;
  }
};

// Add the missing functions
export const updateDescriptor = async (id: string, updates: Partial<ActionPlanDescriptor>) => {
  try {
    const { data, error } = await supabase
      .from('action_plan_descriptors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating descriptor:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateDescriptor:', error);
    return { success: false, error: 'Unexpected error updating descriptor' };
  }
};

export const getActionPlanDescriptors = async (userId: string, section: string) => {
  try {
    const { data, error } = await supabase
      .from('action_plan_descriptors')
      .select('*')
      .eq('user_id', userId)
      .eq('section', section);
      
    if (error) {
      console.error('Error fetching descriptors:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as ActionPlanDescriptor[] };
  } catch (error) {
    console.error('Error in getActionPlanDescriptors:', error);
    return { success: false, error: 'Unexpected error fetching descriptors' };
  }
};

export const addProgressNote = async (descriptorId: string, noteText: string) => {
  try {
    const { data, error } = await supabase
      .from('action_plan_progress_notes')
      .insert({
        descriptor_id: descriptorId,
        note_text: noteText,
        note_date: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error adding progress note:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in addProgressNote:', error);
    return { success: false, error: 'Unexpected error adding progress note' };
  }
};

export const getProgressNotes = async (descriptorId: string) => {
  try {
    const { data, error } = await supabase
      .from('action_plan_progress_notes')
      .select('*')
      .eq('descriptor_id', descriptorId)
      .order('note_date', { ascending: false });
      
    if (error) {
      console.error('Error fetching progress notes:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as ProgressNote[] };
  } catch (error) {
    console.error('Error in getProgressNotes:', error);
    return { success: false, error: 'Unexpected error fetching progress notes' };
  }
};

interface TemplateData {
  name: string;
  user_id: string;
  descriptors: any;
}

export const saveAsTemplate = async (userId: string, templateName: string) => {
  try {
    // First get the user's current action plan descriptors
    const { data: descriptors, error: fetchError } = await supabase
      .from('action_plan_descriptors')
      .select('*')
      .eq('user_id', userId);
      
    if (fetchError) {
      console.error('Error fetching descriptors for template:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!descriptors || descriptors.length === 0) {
      return { success: false, error: 'No descriptors found to save as template' };
    }
    
    // Create a properly typed template object
    const templateData: TemplateData = {
      name: templateName,
      user_id: userId,
      descriptors: descriptors
    };
    
    // Save the template
    const { error: templateError } = await supabase
      .from('action_plan_templates')
      .insert(templateData);
      
    if (templateError) {
      console.error('Error saving template:', templateError);
      return { success: false, error: templateError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in saveAsTemplate:', error);
    return { success: false, error: 'Unexpected error saving template' };
  }
};

export const initializeActionPlan = async (userId: string) => {
  try {
    // Check if the user already has action plan descriptors
    const { count, error: countError } = await supabase
      .from('action_plan_descriptors')
      .select('*', { count: 'exact', head: true } as { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) {
      console.error('Error checking existing descriptors:', countError);
      return { success: false, error: countError.message };
    }
    
    // If the user already has descriptors, return success without doing anything
    if (count && count > 0) {
      return { success: true, message: 'Action plan already initialized' };
    }
    
    // Get default template
    // Assuming the is_default column exists and the descriptors are stored as JSON
    const { data: template, error: templateError } = await supabase
      .from('action_plan_templates')
      .select('*')
      .eq('is_default', true)
      .single();
      
    if (templateError) {
      console.error('Error fetching default template:', templateError);
      return { success: false, error: templateError.message };
    }
    
    if (!template) {
      return { success: false, error: 'Default template not found' };
    }
    
    // Fetch the descriptors from the template
    const templateDescriptors = template.descriptors || [];
    
    // Create descriptors for the user based on the template
    const descriptorsToInsert = templateDescriptors.map((descriptor: any) => ({
      user_id: userId,
      section: descriptor.section || '',
      reference: descriptor.reference || '',
      index_number: descriptor.index_number || 0,
      descriptor_text: descriptor.descriptor_text || '',
      status: 'not_started' as DescriptorStatus,
      deadline: null,
      assigned_to: '',
      key_actions: ''
    }));
    
    if (descriptorsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('action_plan_descriptors')
        .insert(descriptorsToInsert);
          
      if (insertError) {
        console.error('Error initializing action plan:', insertError);
        return { success: false, error: insertError.message };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in initializeActionPlan:', error);
    return { success: false, error: 'Unexpected error initializing action plan' };
  }
};

export const getSectionProgressSummary = async (userId: string) => {
  try {
    const { data: descriptors, error } = await supabase
      .from('action_plan_descriptors')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching section summary:', error);
      return { success: false, error: error.message };
    }
    
    // Group descriptors by section and calculate statistics
    const sectionMap = new Map();
    
    descriptors.forEach((descriptor: ActionPlanDescriptor) => {
      if (!sectionMap.has(descriptor.section)) {
        sectionMap.set(descriptor.section, {
          key: descriptor.section.toLowerCase().replace(/\s+/g, '_'),
          title: descriptor.section,
          totalCount: 0,
          completedCount: 0,
          inProgressCount: 0,
          notStartedCount: 0,
          blockedCount: 0,
          notApplicableCount: 0,
          percentComplete: 0
        });
      }
      
      const sectionStats = sectionMap.get(descriptor.section);
      sectionStats.totalCount += 1;
      
      // Use the correct enum values from DescriptorStatus
      switch (descriptor.status) {
        case 'completed':
          sectionStats.completedCount += 1;
          break;
        case 'in_progress':
          sectionStats.inProgressCount += 1;
          break;
        case 'not_started':
          sectionStats.notStartedCount += 1;
          break;
        case 'blocked':
          sectionStats.blockedCount += 1;
          break;
        case 'not_applicable':
          sectionStats.notApplicableCount += 1;
          break;
      }
      
      // Calculate percentage (excluding not_applicable items)
      const countableItems = sectionStats.totalCount - sectionStats.notApplicableCount;
      sectionStats.percentComplete = countableItems > 0 
        ? Math.round((sectionStats.completedCount / countableItems) * 100) 
        : 0;
    });
    
    return { 
      success: true, 
      data: Array.from(sectionMap.values())
    };
  } catch (error) {
    console.error('Error in getSectionProgressSummary:', error);
    return { success: false, error: 'Unexpected error getting section summary' };
  }
};

export const generatePDF = async (userId: string) => {
  try {
    // In a real implementation, this would trigger a serverless function to generate a PDF
    // For now, we'll just simulate success
    console.log(`Generating PDF for user ${userId}`);
    
    // Request PDF generation from the server
    const { data, error } = await supabase
      .functions
      .invoke('generate-action-plan-pdf', {
        body: { userId }
      });
      
    if (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    }
    
    // In a complete implementation, this would return a download URL
    return { success: true, data };
  } catch (error) {
    console.error('Error in generatePDF:', error);
    return { success: false, error: 'Unexpected error generating PDF' };
  }
};
