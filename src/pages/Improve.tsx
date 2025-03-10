
import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Save } from 'lucide-react';
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

const Improve = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const { orientation, isMobile } = useOrientation();

  useEffect(() => {
    if (user && !hasInitialized) {
      initializeActionPlanData();
      setHasInitialized(true);
    }
  }, [user, hasInitialized]);

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
        </div>
        
        {isLoading ? (
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
      
      {user && (
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
