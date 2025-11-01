'use client';

import { useState } from 'react';
import { useBinanceSocket } from '@/hooks/useBinanceSocket';
import OrderBook from '@/components/trading/OrderBook';
import RecentTrades from '@/components/trading/RecentTrades';
import SymbolSelector from '@/components/trading/SymbolSelector';
import ConnectionStatus from '@/components/trading/ConnectionStatus';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState('btcusdt');
  const { trades, orderBook, isConnected, error } = useBinanceSocket(selectedSymbol);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                2CentsCapital
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-Time Order Book Visualizer
              </p>
            </div>
            <ConnectionStatus isConnected={isConnected} error={error} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Symbol Selector */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <SymbolSelector
            selectedSymbol={selectedSymbol}
            onSymbolChange={setSelectedSymbol}
          />
        </div>

        {/* Trading Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Book - Takes 2 columns */}
          <div className="lg:col-span-2">
            <OrderBook orderBook={orderBook} />
          </div>

          {/* Recent Trades - Takes 1 column */}
          <div className="lg:col-span-1">
            <RecentTrades trades={trades} />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Live market data from Binance WebSocket API
          </p>
          <p className="mt-1">
            Updates in real-time • Symbol: {selectedSymbol.toUpperCase()}
          </p>
        </div>
      </main>
    </div>
  );
}
