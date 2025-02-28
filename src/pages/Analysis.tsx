
import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analysis = () => {
  // Mock data for demonstration
  const surveys = [
    { id: 1, name: 'Spring Term 2023', date: 'March 2023' },
    { id: 2, name: 'Summer Term 2023', date: 'July 2023' },
    { id: 3, name: 'Autumn Term 2023', date: 'November 2023' },
  ];

  const [selectedSurvey, setSelectedSurvey] = useState(surveys[2].id);

  // Mock analysis data
  const wellbeingCategories = [
    { name: 'Work-Life Balance', school: 72, national: 68 },
    { name: 'Professional Development', school: 81, national: 74 },
    { name: 'Workload', school: 63, national: 59 },
    { name: 'Recognition', school: 78, national: 71 },
    { name: 'Communication', school: 85, national: 76 },
    { name: 'Support', school: 79, national: 72 },
    { name: 'Workplace Culture', school: 83, national: 77 },
  ];

  // Sample questions for each category
  const questions = {
    'Work-Life Balance': [
      { question: 'I can maintain a healthy balance between work and personal life', school: 67, national: 62 },
      { question: 'I rarely need to work evenings or weekends', school: 58, national: 55 },
      { question: 'I have enough time for rest and recovery', school: 71, national: 65 },
    ],
    'Workload': [
      { question: 'My workload is manageable', school: 59, national: 54 },
      { question: 'I have enough time to complete my work to a standard I am happy with', school: 61, national: 57 },
      { question: 'Administrative tasks don\'t interfere with my core responsibilities', school: 55, national: 51 },
    ],
  };

  const [selectedCategory, setSelectedCategory] = useState('Work-Life Balance');

  return (
    <MainLayout>
      <div className="page-container">
        <PageTitle 
          title="Survey Analysis" 
          subtitle="Compare your school's results with national benchmarks"
        />
        
        <div className="card p-6 mb-8 animate-slide-up">
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div>
              <label htmlFor="survey-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Survey
              </label>
              <select
                id="survey-select"
                className="form-input"
                value={selectedSurvey}
                onChange={(e) => setSelectedSurvey(Number(e.target.value))}
              >
                {surveys.map((survey) => (
                  <option key={survey.id} value={survey.id}>
                    {survey.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Wellbeing Scores by Category</h3>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={wellbeingCategories}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#4B5563' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: '#4B5563' }}
                  domain={[0, 100]}
                  label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fill: '#4B5563' } }}
                />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="school" 
                  name="Your School" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="national" 
                  name="National Average" 
                  fill="#d1d5db" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Click on any category in the chart to view detailed question responses.
          </p>
        </div>

        <div className="card p-6 animate-slide-up">
          <div className="mb-6">
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Category for Detailed Analysis
            </label>
            <select
              id="category-select"
              className="form-input w-full sm:w-72"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {Object.keys(questions).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedCategory} - Question Breakdown</h3>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={questions[selectedCategory as keyof typeof questions]}
                margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  tick={{ fill: '#4B5563' }}
                  domain={[0, 100]}
                />
                <YAxis 
                  type="category"
                  dataKey="question" 
                  tick={{ fill: '#4B5563' }}
                  width={150}
                />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="school" 
                  name="Your School" 
                  fill="#8b5cf6" 
                  radius={[0, 4, 4, 0]} 
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="national" 
                  name="National Average" 
                  fill="#d1d5db" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <h4 className="text-md font-medium text-gray-900 mb-2">Insights</h4>
            <p className="text-sm text-gray-600">
              Your school is performing above the national average in most {selectedCategory.toLowerCase()} metrics. 
              Staff particularly appreciate the {selectedCategory === 'Work-Life Balance' ? 
                'time available for rest and recovery' : 
                'ability to complete work to a satisfactory standard'}.
            </p>
            <h4 className="text-md font-medium text-gray-900 mt-4 mb-2">Recommendations</h4>
            <p className="text-sm text-gray-600">
              Consider implementing more {selectedCategory === 'Work-Life Balance' ? 
                'flexible working arrangements to further improve work-life balance scores' : 
                'streamlined processes to reduce administrative burden'}.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analysis;
