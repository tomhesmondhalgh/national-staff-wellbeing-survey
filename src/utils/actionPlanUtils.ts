
import { supabase } from '../lib/supabase/client';
import { ActionPlanDescriptor, ActionPlanTemplate, ProgressNote, DescriptorStatus, ACTION_PLAN_SECTIONS } from '../types/actionPlan';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Initialize action plan for a user
export const initializeActionPlan = async (userId: string) => {
  try {
    console.log('Initializing action plan for user:', userId);
    
    // Delete existing descriptors for this user
    const { error: deleteError } = await supabase
      .from('action_plan_descriptors')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting existing descriptors:', deleteError);
      throw deleteError;
    }

    // Create descriptors for all sections
    const descriptorsToInsert = ACTION_PLAN_SECTIONS.flatMap(section => 
      section.descriptors.map(descriptor => ({
        user_id: userId,
        section: section.title,
        reference: descriptor.reference,
        index_number: descriptor.index_number,
        descriptor_text: descriptor.text,
        status: 'Not Started' as DescriptorStatus,
      }))
    );

    console.log(`Inserting ${descriptorsToInsert.length} descriptors`);
    const { error } = await supabase
      .from('action_plan_descriptors')
      .insert(descriptorsToInsert);

    if (error) {
      console.error('Error inserting descriptors:', error);
      throw error;
    }

    console.log('Action plan initialized successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error initializing action plan:', error);
    return { success: false, error: error.message };
  }
};

// Get all descriptors for a user
export const getActionPlanDescriptors = async (userId: string, section?: string) => {
  try {
    console.log('Getting descriptors for user:', userId, 'section:', section);
    
    let query = supabase
      .from('action_plan_descriptors')
      .select(`
        *,
        progress_notes_count:action_plan_progress_notes(count)
      `)
      .eq('user_id', userId);

    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query.order('index_number', { ascending: true });

    if (error) {
      console.error('Supabase error fetching descriptors:', error);
      throw error;
    }

    // Format the descriptors to ensure progress_notes_count is a number
    const formattedData = data?.map(descriptor => {
      // Extract the count from the aggregate
      let count = 0;
      
      if (descriptor.progress_notes_count) {
        // If it's an array (from count aggregation), get the first element's count
        if (Array.isArray(descriptor.progress_notes_count) && descriptor.progress_notes_count.length > 0) {
          count = Number(descriptor.progress_notes_count[0]?.count || 0);
        } 
        // If it's an object with count property (typical Postgres aggregation result)
        else if (typeof descriptor.progress_notes_count === 'object' && descriptor.progress_notes_count !== null) {
          count = Number(descriptor.progress_notes_count.count || 0);
        }
        // If it's already a number
        else if (typeof descriptor.progress_notes_count === 'number') {
          count = descriptor.progress_notes_count;
        }
      }
      
      return {
        ...descriptor,
        progress_notes_count: count
      };
    });

    console.log('Formatted descriptors with note counts, sample:', 
      formattedData && formattedData.length > 0 ? 
        `First item has ${formattedData[0].progress_notes_count} notes` : 
        'No descriptors found');
    
    return { success: true, data: formattedData || [] };
  } catch (error: any) {
    console.error('Error fetching descriptors:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Update descriptor
export const updateDescriptor = async (descriptorId: string, updates: Partial<ActionPlanDescriptor>) => {
  try {
    console.log('Updating descriptor:', descriptorId, updates);
    
    const { error } = await supabase
      .from('action_plan_descriptors')
      .update(updates)
      .eq('id', descriptorId);

    if (error) {
      console.error('Error updating descriptor:', error);
      throw error;
    }

    console.log('Descriptor updated successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating descriptor:', error);
    toast({
      title: 'Failed to update',
      description: error.message,
      variant: 'destructive'
    });
    return { success: false, error: error.message };
  }
};

// Get progress notes for a descriptor
export const getProgressNotes = async (descriptorId: string) => {
  try {
    console.log('Fetching progress notes for descriptor:', descriptorId);
    
    const { data, error } = await supabase
      .from('action_plan_progress_notes')
      .select('*')
      .eq('descriptor_id', descriptorId)
      .order('note_date', { ascending: false });

    if (error) {
      console.error('Supabase error fetching progress notes:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} progress notes`);
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching progress notes:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Add a progress note
export const addProgressNote = async (descriptorId: string, noteText: string) => {
  try {
    console.log('Adding progress note for descriptor:', descriptorId);
    
    const { data, error } = await supabase
      .from('action_plan_progress_notes')
      .insert({
        descriptor_id: descriptorId,
        note_text: noteText
      })
      .select();

    if (error) {
      console.error('Supabase error adding progress note:', error);
      throw error;
    }

    console.log('Added progress note successfully:', data);
    
    // After adding a note, clear the note cache for this descriptor
    // This forces a fresh fetch next time
    sessionStorage.removeItem(`notes_${descriptorId}`);
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error adding progress note:', error);
    toast({
      title: 'Failed to add note',
      description: error.message,
      variant: 'destructive'
    });
    return { success: false, error: error.message };
  }
};

// Save as template
export const saveAsTemplate = async (userId: string, templateName: string) => {
  try {
    // Create template
    const { data: template, error: templateError } = await supabase
      .from('action_plan_templates')
      .insert({
        user_id: userId,
        name: templateName
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Update descriptors with template_id
    const { error: updateError } = await supabase
      .from('action_plan_descriptors')
      .update({ template_id: template.id })
      .eq('user_id', userId)
      .is('template_id', null);

    if (updateError) throw updateError;

    return { success: true, templateId: template.id };
  } catch (error: any) {
    console.error('Error saving template:', error);
    toast({
      title: 'Failed to save template',
      description: error.message,
      variant: 'destructive'
    });
    return { success: false, error: error.message };
  }
};

// Get section progress summary
export const getSectionProgressSummary = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('action_plan_descriptors')
      .select('section, status')
      .eq('user_id', userId);

    if (error) throw error;

    const sectionSummary = ACTION_PLAN_SECTIONS.map(section => {
      const sectionDescriptors = data?.filter(d => d.section === section.title) || [];
      const totalCount = sectionDescriptors.length;
      const completedCount = sectionDescriptors.filter(d => d.status === 'Completed').length;
      const inProgressCount = sectionDescriptors.filter(d => d.status === 'In Progress').length;
      const notStartedCount = sectionDescriptors.filter(d => d.status === 'Not Started').length;
      const blockedCount = sectionDescriptors.filter(d => d.status === 'Blocked').length;
      const notApplicableCount = sectionDescriptors.filter(d => d.status === 'Not Applicable').length;
      
      const percentComplete = totalCount > 0 ? 
        Math.round((completedCount / (totalCount - notApplicableCount)) * 100) || 0 : 0;

      return {
        title: section.title,
        key: section.key,
        totalCount,
        completedCount,
        inProgressCount,
        notStartedCount,
        blockedCount,
        notApplicableCount,
        percentComplete
      };
    });

    return { success: true, data: sectionSummary };
  } catch (error: any) {
    console.error('Error fetching section summary:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// Generate PDF export
export const generatePDF = async (userId: string) => {
  try {
    // Fetch all descriptors with their progress notes
    const { data: descriptors } = await supabase
      .from('action_plan_descriptors')
      .select('*')
      .eq('user_id', userId)
      .order('section')
      .order('index_number');

    if (!descriptors) {
      throw new Error('No data to export');
    }

    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Staff Wellbeing Action Plan', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    // Group descriptors by section
    const sections = [...new Set(descriptors.map(d => d.section))];

    let yPos = 40;
    
    for (const section of sections) {
      doc.setFontSize(14);
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(section, 14, yPos);
      yPos += 10;
      
      const sectionDescriptors = descriptors.filter(d => d.section === section);
      
      for (const descriptor of sectionDescriptors) {
        doc.setFontSize(12);
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(`${descriptor.reference} ${descriptor.descriptor_text}`, 14, yPos, {
          maxWidth: 180
        });
        yPos += 10;
        
        doc.setFontSize(10);
        doc.text(`Status: ${descriptor.status}`, 20, yPos);
        yPos += 6;
        
        if (descriptor.deadline) {
          doc.text(`Deadline: ${new Date(descriptor.deadline).toLocaleDateString()}`, 20, yPos);
          yPos += 6;
        }
        
        if (descriptor.assigned_to) {
          doc.text(`Assigned to: ${descriptor.assigned_to}`, 20, yPos);
          yPos += 6;
        }
        
        if (descriptor.key_actions) {
          doc.text(`Key Actions: ${descriptor.key_actions}`, 20, yPos, {
            maxWidth: 170
          });
          yPos += descriptor.key_actions.length > 50 ? 12 : 6;
        }
        
        // Fetch progress notes for this descriptor
        const { data: notes } = await supabase
          .from('action_plan_progress_notes')
          .select('*')
          .eq('descriptor_id', descriptor.id)
          .order('note_date', { ascending: false });
        
        if (notes && notes.length > 0) {
          doc.text('Progress Notes:', 20, yPos);
          yPos += 6;
          
          for (const note of notes) {
            if (yPos > 260) {
              doc.addPage();
              yPos = 20;
            }
            
            const noteDate = new Date(note.note_date).toLocaleDateString();
            doc.text(`• ${noteDate}: ${note.note_text}`, 24, yPos, {
              maxWidth: 165
            });
            yPos += note.note_text.length > 100 ? 14 : 8;
          }
        }
        
        yPos += 6;
      }
      
      yPos += 10;
    }
    
    doc.save('staff-wellbeing-action-plan.pdf');
    return { success: true };
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    toast({
      title: 'Failed to generate PDF',
      description: error.message,
      variant: 'destructive'
    });
    return { success: false, error: error.message };
  }
};
