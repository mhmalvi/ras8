
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index: React.FC = () => {
  // Always redirect to landing page as the default route
  return <Navigate to="/landing" replace />;
};

export default Index;
