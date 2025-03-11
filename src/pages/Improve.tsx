
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Save, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { initializeActionPlan, getSectionProgressSummary, generatePDF } from '../utils/actionPlanUtils';
import { ACTION_PLAN_SECTIONS } from '../types/actionPlan';
import DescriptorTable from '../components/action-plan/DescriptorTable';
import SaveTemplateDialog from '../components/action-plan/SaveTemplateDialog';
import SectionSummary from '../components/action-plan/SectionSummary';
import BottomNavigation from '../components/action-plan/BottomNavigation';
import ScreenOrientationOverlay from '../components/ui/ScreenOrientationOverlay';
import { useOrientation } from '../hooks/useOrientation';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

const Improve = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const { orientation, isMobile } = useOrientation();
  const { hasAccess, isLoading: isSubscriptionLoading } = useSubscription();
  const [hasFoundationPlan, setHasFoundationPlan] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAccess() {
      if (hasAccess) {
        const canAccess = await hasAccess('foundation');
        setHasFoundationPlan(canAccess);
      }
    }
    
    if (!isSubscriptionLoading) {
      checkAccess();
    }
  }, [hasAccess, isSubscriptionLoading]);

  useEffect(() => {
    if (user && !hasInitialized && hasFoundationPlan) {
      initializeActionPlanData();
      setHasInitialized(true);
    }
  }, [user, hasInitialized, hasFoundationPlan]);

  const initializeActionPlanData = async () => {
    setIsLoading(true);
    try {
      if (user?.id) {
        await initializeActionPlan(user.id);
        await fetchSummaryData();
      }
    } catch (error) {
      console.error("Error initializing action plan:", error);
      toast.error("Failed to initialize action plan");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummaryData = async () => {
    if (user?.id) {
      const result = await getSectionProgressSummary(user.id);
      if (result.success && result.data) {
        setSummaryData(result.data);
      }
    }
  };

  const handleExportPDF = async () => {
    if (!user) return;
    
    setIsGeneratingPDF(true);
    const result = await generatePDF(user.id);
    setIsGeneratingPDF(false);
    
    if (result.success) {
      toast.success('PDF exported successfully');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shouldShowOverlay = isMobile && orientation === 'portrait' && !overlayDismissed;
  const isSubscriptionChecking = isSubscriptionLoading || hasFoundationPlan === null;

  return (
    <MainLayout>
      {shouldShowOverlay && (
        <ScreenOrientationOverlay 
          onDismiss={() => setOverlayDismissed(true)} 
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <PageTitle 
            title="Wellbeing Action Plan" 
            subtitle="Track and improve staff wellbeing using this action planning tool" 
            alignment="left" 
          />
          
          {hasFoundationPlan && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveTemplate(true)}
                disabled={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isLoading || isGeneratingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Export PDF'}
              </Button>
            </div>
          )}
        </div>
        
        {isSubscriptionChecking ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="mb-4">Checking subscription...</div>
            </div>
          </div>
        ) : !hasFoundationPlan ? (
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Upgrade to Access the Action Plan</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              The Wellbeing Action Plan is available with Foundation, Progress, and Premium plans. 
              Upgrade today to access powerful tools for planning and tracking staff wellbeing improvements.
            </p>
            
            <div className="max-w-md mx-auto bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
              <h3 className="font-semibold text-lg mb-3">With the Action Plan you can:</h3>
              <ul className="text-left space-y-2 mb-4">
                <li className="flex items-start">
                  <div className="mr-2 mt-1 text-brandPurple-500">•</div>
                  <span>Track progress on wellbeing initiatives</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 text-brandPurple-500">•</div>
                  <span>Create detailed action plans based on survey results</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 text-brandPurple-500">•</div>
                  <span>Record progress notes and achievements</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 text-brandPurple-500">•</div>
                  <span>Export reports for stakeholders</span>
                </li>
              </ul>
            </div>
            
            <Button 
              onClick={() => navigate('/upgrade')} 
              size="lg" 
              className="px-8"
            >
              View Upgrade Options <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="mb-4">Loading action plan...</div>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full mb-6 overflow-x-auto flex flex-nowrap justify-start">
              <TabsTrigger value="summary" className="flex-shrink-0">
                Summary
              </TabsTrigger>
              {ACTION_PLAN_SECTIONS.map((section) => (
                <TabsTrigger 
                  key={section.key} 
                  value={section.key}
                  className="flex-shrink-0"
                >
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="summary" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryData.map((section) => (
                  <SectionSummary
                    key={section.key}
                    title={section.title}
                    totalCount={section.totalCount}
                    completedCount={section.completedCount}
                    inProgressCount={section.inProgressCount}
                    notStartedCount={section.notStartedCount}
                    blockedCount={section.blockedCount}
                    notApplicableCount={section.notApplicableCount}
                    percentComplete={section.percentComplete}
                  />
                ))}
              </div>
            </TabsContent>
            
            {ACTION_PLAN_SECTIONS.map((section) => (
              <TabsContent key={section.key} value={section.key} className="mt-6 overflow-x-auto">
                {user && (
                  <DescriptorTable 
                    userId={user.id}
                    section={section.title}
                    onRefreshSummary={fetchSummaryData}
                  />
                )}
              </TabsContent>
            ))}
            
            <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
          </Tabs>
        )}
      </div>
      
      {user && hasFoundationPlan && (
        <SaveTemplateDialog 
          userId={user.id}
          isOpen={showSaveTemplate}
          onClose={() => setShowSaveTemplate(false)}
        />
      )}
    </MainLayout>
  );
};

export default Improve;
