
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '../components/ui/textarea';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, completeUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    jobTitle: '',
    schoolName: '',
    schoolAddress: '',
  });

  useEffect(() => {
    // Redirect to dashboard if no user is found
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast.error('No user found. Please log in again.');
      navigate('/login');
      return;
    }

    try {
      const userData = {
        ...formData,
        email: user.email,
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
      };

      const { error, success } = await completeUserProfile(user.id, userData);

      if (success) {
        toast.success('Profile completed successfully!');
        navigate('/dashboard');
      } else if (error) {
        console.error('Error completing profile:', error);
        toast.error('Failed to complete profile', {
          description: error.message || 'Please check your information and try again.'
        });
      }
    } catch (err: any) {
      console.error('Profile completion error:', err);
      toast.error('Error completing profile', {
        description: 'Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Complete your profile" 
          subtitle="Tell us about your school to finish setting up your account"
        />
        <div className="max-w-md w-full mx-auto glass-card rounded-2xl p-8 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Job title
              </label>
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                required
                className="form-input w-full"
                value={formData.jobTitle}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                School/College name
              </label>
              <input
                id="schoolName"
                name="schoolName"
                type="text"
                required
                className="form-input w-full"
                value={formData.schoolName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700 mb-1">
                School/College address
              </label>
              <Textarea
                id="schoolAddress"
                name="schoolAddress"
                rows={3}
                required
                className="form-input w-full"
                value={formData.schoolAddress}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <Button 
                type="submit" 
                className="btn-primary w-full mt-2 flex justify-center items-center" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Completing profile...
                  </>
                ) : (
                  <>Complete profile</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Onboarding;
