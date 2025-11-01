'use client';

import React from 'react';

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const POPULAR_SYMBOLS = [
  { symbol: 'btcusdt', label: 'BTC/USDT' },
  { symbol: 'ethusdt', label: 'ETH/USDT' },
  { symbol: 'bnbusdt', label: 'BNB/USDT' },
  { symbol: 'solusdt', label: 'SOL/USDT' },
  { symbol: 'xrpusdt', label: 'XRP/USDT' },
];

const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedSymbol,
  onSymbolChange,
}) => {
  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm font-medium text-gray-700">Symbol:</span>
      <div className="flex gap-2">
        {POPULAR_SYMBOLS.map(({ symbol, label }) => (
          <button
            key={symbol}
            onClick={() => onSymbolChange(symbol)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSymbol === symbol
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(SymbolSelector);
