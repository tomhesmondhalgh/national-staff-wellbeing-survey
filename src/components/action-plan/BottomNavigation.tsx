
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ACTION_PLAN_SECTIONS } from '@/types/actionPlan';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  // Skip "summary" tab for navigation since we only want to navigate between action plan sections
  const sectionKeys = ACTION_PLAN_SECTIONS.map(section => section.key);
  const currentIndex = sectionKeys.indexOf(activeTab);
  
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < sectionKeys.length - 1;
  
  const handlePrevious = () => {
    if (hasPrevious) {
      const previousSection = sectionKeys[currentIndex - 1];
      onTabChange(previousSection);
    }
  };
  
  const handleNext = () => {
    if (hasNext) {
      const nextSection = sectionKeys[currentIndex + 1];
      onTabChange(nextSection);
    }
  };
  
  // Get the labels for current, previous and next sections
  const currentSection = ACTION_PLAN_SECTIONS.find(section => section.key === activeTab);
  const previousSection = hasPrevious 
    ? ACTION_PLAN_SECTIONS.find(section => section.key === sectionKeys[currentIndex - 1]) 
    : null;
  const nextSection = hasNext 
    ? ACTION_PLAN_SECTIONS.find(section => section.key === sectionKeys[currentIndex + 1]) 
    : null;
  
  // Don't show navigation if we're on the summary tab
  if (activeTab === 'summary') {
    return null;
  }
  
  return (
    <div className="flex justify-between items-center py-4 mt-6 border-t border-gray-200">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={!hasPrevious}
        className="flex items-center space-x-2"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>{previousSection ? previousSection.title : ''}</span>
      </Button>
      
      <div className="text-sm text-gray-500">
        {currentSection ? currentSection.title : ''}
      </div>
      
      <Button
        variant="outline"
        onClick={handleNext}
        disabled={!hasNext}
        className="flex items-center space-x-2"
      >
        <span>{nextSection ? nextSection.title : ''}</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default BottomNavigation;
