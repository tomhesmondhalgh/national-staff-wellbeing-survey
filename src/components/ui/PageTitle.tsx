import React from 'react';
interface PageTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}
const PageTitle: React.FC<PageTitleProps> = ({
  title,
  subtitle,
  className = ''
}) => {
  return <div className={`mb-8 ${className}`}>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-left">
        {title}
      </h1>
      {subtitle && <p className="text-lg text-gray-600">
          {subtitle}
        </p>}
    </div>;
};
export default PageTitle;