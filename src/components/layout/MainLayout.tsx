
import React from 'react';
import Navbar from './Navbar';
import { useTestingMode } from '../../contexts/TestingModeContext';
import { TestingModeStatus } from '../admin/testing/TestingModeStatus';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isTestingMode, selectedPlan, selectedRole } = useTestingMode();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-brandPurple-50">
      <Navbar />
      {isTestingMode && (
        <TestingModeStatus 
          isTestingMode={isTestingMode} 
          selectedPlan={selectedPlan} 
          selectedRole={selectedRole} 
        />
      )}
      <main className="flex-grow w-full px-5 sm:px-20">
        {children}
      </main>
      <footer className="py-6 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} National Staff Wellbeing Survey. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
