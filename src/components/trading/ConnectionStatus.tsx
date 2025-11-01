'use client';

import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  error,
}) => {
  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm text-red-700">
          Error: {error}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
        isConnected
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
        }`}
      />
      <span
        className={`text-sm ${
          isConnected ? 'text-green-700' : 'text-yellow-700'
        }`}
      >
        {isConnected ? 'Connected' : 'Connecting...'}
      </span>
    </div>
  );
};

export default React.memo(ConnectionStatus);
