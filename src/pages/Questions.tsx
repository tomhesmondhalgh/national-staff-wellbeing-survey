
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import QuestionsList from '../components/questions/QuestionsList';
import QuestionForm from '../components/questions/QuestionForm';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const Questions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchQuestions();
  }, [user, navigate]);

  const fetchQuestions = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('custom_questions')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      const { error } = await supabase
        .from('custom_questions')
        .delete()
        .eq('id', questionId)
        .eq('creator_id', user.id);
      
      if (error) throw error;
      
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  const handleFormSubmit = async (questionData) => {
    try {
      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('custom_questions')
          .update({
            text: questionData.text,
            type: questionData.type,
            options: questionData.type === 'dropdown' ? questionData.options : null
          })
          .eq('id', editingQuestion.id)
          .eq('creator_id', user.id);
        
        if (error) throw error;
        toast.success('Question updated successfully');
      } else {
        // Create new question
        const { error } = await supabase
          .from('custom_questions')
          .insert({
            text: questionData.text,
            type: questionData.type,
            options: questionData.type === 'dropdown' ? questionData.options : null,
            creator_id: user.id
          });
        
        if (error) throw error;
        toast.success('Question created successfully');
      }
      
      setShowForm(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingQuestion(null);
  };

  return (
    <MainLayout>
      <div className="page-container">
        <div className="flex justify-between items-center mb-6">
          <PageTitle 
            title="Custom Questions" 
            subtitle="Create and manage your own survey questions"
          />
          <Button onClick={handleCreateQuestion} className="flex items-center gap-2">
            <Plus size={16} />
            New Question
          </Button>
        </div>
        
        {showForm ? (
          <QuestionForm 
            initialData={editingQuestion}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        ) : (
          <QuestionsList 
            questions={questions}
            isLoading={isLoading}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Questions;
