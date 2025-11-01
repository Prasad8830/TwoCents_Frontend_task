'use client';

import React from 'react';
import { useAppContext } from '@/hooks/useAppContext';

const Header: React.FC = () => {
  const { state } = useAppContext();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">2CentsCapital</h1>
          {state.user && (
            <div className="text-sm text-gray-600">
              Welcome, {state.user.name}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
