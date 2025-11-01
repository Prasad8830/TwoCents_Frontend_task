'use client';

import React, { useMemo } from 'react';
import { OrderBookData, ProcessedOrderBookLevel } from '@/types';

interface OrderBookProps {
  orderBook: OrderBookData;
}

const MAX_LEVELS = 20; // Display top 20 levels

const processOrderBookLevels = (
  levels: Map<string, string>,
  isBid: boolean
): ProcessedOrderBookLevel[] => {
  // Convert Map to array and parse values
  const entries = Array.from(levels.entries()).map(([price, quantity]) => ({
    price: parseFloat(price),
    quantity: parseFloat(quantity),
  }));

  // Sort: bids descending, asks ascending
  const sorted = entries.sort((a, b) =>
    isBid ? b.price - a.price : a.price - b.price
  );

  // Take top levels
  const topLevels = sorted.slice(0, MAX_LEVELS);

  // Calculate cumulative totals
  let cumulative = 0;
  const processed = topLevels.map((level) => {
    cumulative += level.quantity;
    return {
      ...level,
      total: cumulative,
    };
  });

  return processed;
};

const OrderBookRow: React.FC<{
  level: ProcessedOrderBookLevel;
  maxTotal: number;
  isBid: boolean;
}> = React.memo(({ level, maxTotal, isBid }) => {
  const depthPercentage = (level.total / maxTotal) * 100;
  const bgColor = isBid ? 'bg-green-500' : 'bg-red-500';
  const textColor = isBid ? 'text-green-600' : 'text-red-600';

  return (
    <div className="relative h-6 text-xs font-mono">
      {/* Depth visualization bar */}
      <div
        className={`absolute inset-y-0 ${isBid ? 'right-0' : 'left-0'} ${bgColor} opacity-10`}
        style={{ width: `${depthPercentage}%` }}
      />
      
      {/* Content */}
      <div className={`relative flex justify-between items-center h-full px-2 ${isBid ? 'flex-row' : 'flex-row'}`}>
        <span className={`${textColor} font-semibold`}>
          {level.price.toFixed(2)}
        </span>
        <span className="text-gray-700">
          {level.quantity.toFixed(6)}
        </span>
        <span className="text-gray-500 text-[10px]">
          {level.total.toFixed(4)}
        </span>
      </div>
    </div>
  );
});

OrderBookRow.displayName = 'OrderBookRow';

const OrderBook: React.FC<OrderBookProps> = ({ orderBook }) => {
  const processedBids = useMemo(
    () => processOrderBookLevels(orderBook.bids, true),
    [orderBook.bids]
  );

  const processedAsks = useMemo(
    () => processOrderBookLevels(orderBook.asks, false),
    [orderBook.asks]
  );

  const maxBidTotal = useMemo(
    () => Math.max(...processedBids.map((b) => b.total), 0),
    [processedBids]
  );

  const maxAskTotal = useMemo(
    () => Math.max(...processedAsks.map((a) => a.total), 0),
    [processedAsks]
  );

  const spread = useMemo(() => {
    const lowestAsk = processedAsks.length > 0 ? processedAsks[0].price : 0;
    const highestBid = processedBids.length > 0 ? processedBids[0].price : 0;
    return lowestAsk - highestBid;
  }, [processedAsks, processedBids]);

  const spreadPercentage = useMemo(() => {
    const lowestAsk = processedAsks.length > 0 ? processedAsks[0].price : 0;
    if (lowestAsk === 0) return 0;
    return (spread / lowestAsk) * 100;
  }, [spread, processedAsks]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Book</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Bids (Buy Orders) */}
        <div>
          <div className="flex justify-between items-center px-2 py-2 bg-green-50 rounded-t text-xs font-semibold text-gray-700 border-b border-green-200">
            <span>Price</span>
            <span>Amount</span>
            <span>Total</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {processedBids.map((bid) => (
              <OrderBookRow
                key={bid.price}
                level={bid}
                maxTotal={maxBidTotal}
                isBid={true}
              />
            ))}
          </div>
          {processedBids.length === 0 && (
            <div className="text-center text-gray-400 py-4 text-sm">
              No bids available
            </div>
          )}
        </div>

        {/* Asks (Sell Orders) */}
        <div>
          <div className="flex justify-between items-center px-2 py-2 bg-red-50 rounded-t text-xs font-semibold text-gray-700 border-b border-red-200">
            <span>Price</span>
            <span>Amount</span>
            <span>Total</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {processedAsks.map((ask) => (
              <OrderBookRow
                key={ask.price}
                level={ask}
                maxTotal={maxAskTotal}
                isBid={false}
              />
            ))}
          </div>
          {processedAsks.length === 0 && (
            <div className="text-center text-gray-400 py-4 text-sm">
              No asks available
            </div>
          )}
        </div>
      </div>

      {/* Spread Display */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Spread
          </div>
          <div className="mt-1 flex items-center justify-center gap-3">
            <span className="text-lg font-bold text-gray-900">
              {spread.toFixed(2)}
            </span>
            <span className="text-sm text-gray-600">
              ({spreadPercentage.toFixed(3)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OrderBook);
