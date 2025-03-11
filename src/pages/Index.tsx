
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

export const Index = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome to Wellbeing Surveys</h1>
        <div className="flex flex-col items-center gap-4">
          <Link 
            to="/login" 
            className="bg-brandPurple-500 hover:bg-brandPurple-600 text-white font-bold py-2 px-4 rounded"
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
