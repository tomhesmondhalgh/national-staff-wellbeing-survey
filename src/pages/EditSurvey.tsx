
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import SurveyForm, { SurveyFormData } from '../components/surveys/SurveyForm';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { format } from 'date-fns';

const EditSurvey = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [surveyData, setSurveyData] = useState<Partial<SurveyFormData> | null>(null);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('survey_templates')
          .select('name, date, close_date')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching survey:', error);
          toast.error("Failed to load survey data", {
            description: "Please try again later."
          });
          navigate('/surveys');
          return;
        }
        
        if (!data) {
          toast.error("Survey not found", {
            description: "The survey you're trying to edit doesn't exist."
          });
          navigate('/surveys');
          return;
        }
        
        // Format dates for the form inputs (YYYY-MM-DD format)
        const formatDateForInput = (dateString: string) => {
          try {
            const date = new Date(dateString);
            return format(date, 'yyyy-MM-dd');
          } catch (e) {
            console.error('Error formatting date:', e);
            return '';
          }
        };
        
        setSurveyData({
          name: data.name,
          date: formatDateForInput(data.date),
          closeDate: data.close_date ? formatDateForInput(data.close_date) : '',
          emails: ''
        });
      } catch (error) {
        console.error('Error:', error);
        toast.error("An error occurred", {
          description: "Please try again later."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [id, navigate]);

  const handleSubmit = async (data: SurveyFormData) => {
    if (!id) return;
    
    try {
      // Update the survey in the database
      const { error } = await supabase
        .from('survey_templates')
        .update({
          name: data.name,
          date: data.date,
          close_date: data.closeDate,
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating survey:', error);
        toast.error("Failed to update survey", {
          description: error.message
        });
        return;
      }
      
      // Show success toast
      toast.success("Survey updated successfully!", {
        description: "Your changes have been saved."
      });
      
      // Navigate back to surveys list
      navigate('/surveys');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("An error occurred", {
        description: "Please try again later."
      });
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/surveys" onClick={(e) => { e.preventDefault(); navigate('/surveys'); }}>
                Surveys
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Survey</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <PageTitle 
          title="Edit Survey" 
          subtitle="Update your existing survey details"
        />
        
        {isLoading ? (
          <div className="card p-6 animate-slide-up">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : surveyData ? (
          <SurveyForm onSubmit={handleSubmit} initialData={surveyData} />
        ) : (
          <div className="card p-6 text-center">
            <p className="text-gray-500">Survey not found or unable to load data.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default EditSurvey;
