
import React from 'react';
import { Chart, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CustomQuestionResultsProps {
  results: any[];
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6', '#ec4899', '#0ea5e9'];

const CustomQuestionResults: React.FC<CustomQuestionResultsProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return null;
  }

  const renderQuestionResults = (item: any) => {
    const { question, responses } = item;
    
    if (!responses || responses.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-gray-500">No responses yet</p>
        </div>
      );
    }
    
    if (question.type === 'text') {
      // For text questions, just list all responses
      return (
        <div className="max-h-96 overflow-y-auto pr-2">
          {responses.map((response: string, index: number) => (
            <div key={index} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
              <p className="text-gray-700">{response}</p>
            </div>
          ))}
        </div>
      );
    } else if (question.type === 'dropdown') {
      // For dropdown questions, create a chart of response frequencies
      const counts: Record<string, number> = {};
      
      // Count occurrences of each option
      responses.forEach((response: string) => {
        counts[response] = (counts[response] || 0) + 1;
      });
      
      // Convert to chart data
      const chartData = Object.entries(counts).map(([name, value]) => ({
        name,
        value
      }));
      
      return (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Custom Question Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              {item.question.text}
            </h4>
            {renderQuestionResults(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomQuestionResults;
