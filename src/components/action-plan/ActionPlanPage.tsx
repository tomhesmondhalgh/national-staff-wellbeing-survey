import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SectionSummary from './SectionSummary';
import { useAuth } from '../../contexts/AuthContext';
import { getSectionProgressSummary, generatePDF, initializeActionPlan } from '../../utils/actionPlanUtils';

const ActionPlanPage = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Initialize action plan if needed
        await initializeActionPlan(user.id);
        
        // Load section summaries
        const result = await getSectionProgressSummary(user.id);
        if (result.success) {
          setSections(result.data);
        }
      } catch (error) {
        console.error('Error loading action plan data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleExportPDF = async () => {
    if (!user) return;
    await generatePDF(user.id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wellbeing Action Plan</h1>
          <p className="text-gray-600">Track and improve staff wellbeing using this action planning tool</p>
        </div>
        <Button 
          onClick={handleExportPDF} 
          className="mt-4 md:mt-0 flex items-center" 
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 md:grid-cols-9 gap-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="life-work-balance">Life-Work Balance</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-64 animate-pulse bg-gray-100"></Card>
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sections.map((section) => (
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
          )}
          {/* Other section tabs will be added here */}
        </>
      )}
    </div>
  );
};

export default ActionPlanPage;
