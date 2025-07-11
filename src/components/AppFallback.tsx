import React from 'react';

export const AppFallback: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Application</h2>
        <p className="text-gray-600">Please wait while we set up your dashboard...</p>
      </div>
    </div>
  );
};

export default AppFallback;