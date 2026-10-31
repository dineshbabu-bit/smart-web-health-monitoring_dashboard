import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanHistory } from '../components/history/ScanHistory';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      <ScanHistory onNavigateToAudit={() => navigate('/dashboard')} />
    </div>
  );
};
