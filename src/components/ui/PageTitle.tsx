
import React from 'react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 animate-slide-up [animation-delay:100ms]">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-gray-600 animate-slide-up [animation-delay:200ms]">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageTitle;
