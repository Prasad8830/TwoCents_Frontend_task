'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trade } from '@/types';

interface RecentTradesProps {
  trades: Trade[];
}

interface TradeRowProps {
  trade: Trade;
  isNew: boolean;
}

const TradeRow: React.FC<TradeRowProps> = React.memo(({ trade, isNew }) => {
  const isBuy = !trade.isBuyerMaker; // If buyer is NOT maker, it's a market buy
  const priceColor = isBuy ? 'text-green-600' : 'text-red-600';
  const flashColor = isBuy ? 'bg-green-100' : 'bg-red-100';
  
  const time = new Date(trade.time);
  const timeString = time.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`flex justify-between items-center px-3 py-1.5 text-xs font-mono transition-colors duration-500 ${
        isNew ? flashColor : 'bg-transparent'
      }`}
    >
      <span className={`font-semibold ${priceColor} min-w-[100px]`}>
        {parseFloat(trade.price).toFixed(2)}
      </span>
      <span className="text-gray-700 min-w-[100px] text-right">
        {parseFloat(trade.quantity).toFixed(6)}
      </span>
      <span className="text-gray-500 text-[10px] min-w-[80px] text-right">
        {timeString}
      </span>
    </div>
  );
});

TradeRow.displayName = 'TradeRow';

const RecentTrades: React.FC<RecentTradesProps> = ({ trades }) => {
  const [flashingTradeIds, setFlashingTradeIds] = useState<Set<string>>(new Set());
  const prevTradesRef = useRef<Trade[]>([]);

  useEffect(() => {
    // Detect new trades by comparing with previous trades
    const newTradeIds = new Set<string>();
    
    if (trades.length > 0 && prevTradesRef.current.length > 0) {
      const prevFirstId = prevTradesRef.current[0]?.id;
      
      // Find all new trades (all trades before the previous first trade)
      for (let i = 0; i < trades.length; i++) {
        if (trades[i].id === prevFirstId) break;
        newTradeIds.add(trades[i].id);
      }
    } else if (trades.length > 0 && prevTradesRef.current.length === 0) {
      // First load - don't flash
      newTradeIds.clear();
    }

    if (newTradeIds.size > 0) {
      setFlashingTradeIds(newTradeIds);
      
      // Remove flash after animation duration
      const timeout = setTimeout(() => {
        setFlashingTradeIds(new Set());
      }, 500);

      return () => clearTimeout(timeout);
    }

    prevTradesRef.current = trades;
  }, [trades]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Trades</h2>

      {/* Header */}
      <div className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-t text-xs font-semibold text-gray-700 border-b border-gray-200">
        <span className="min-w-[100px]">Price</span>
        <span className="min-w-[100px] text-right">Amount</span>
        <span className="min-w-[80px] text-right">Time</span>
      </div>

      {/* Trades List */}
      <div className="mt-1 max-h-[600px] overflow-y-auto">
        {trades.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            Waiting for trades...
          </div>
        ) : (
          trades.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              isNew={flashingTradeIds.has(trade.id)}
            />
          ))
        )}
      </div>

      {/* Trade Count */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-center text-xs text-gray-500">
        Showing {trades.length} most recent trades
      </div>
    </div>
  );
};

export default React.memo(RecentTrades);
