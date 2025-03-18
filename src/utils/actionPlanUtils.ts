
// In utils/actionPlanUtils.ts, let's fix the count property issue
export const getActionPlanNoteCount = async (descriptorId: string) => {
  try {
    const { data, count, error } = await supabase
      .from('action_plan_progress_notes')
      .select('*', { count: 'exact' })
      .eq('descriptor_id', descriptorId);
    
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
