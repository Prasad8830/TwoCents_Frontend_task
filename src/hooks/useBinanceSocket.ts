'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Trade,
  OrderBookData,
  BinanceTradeMessage,
  BinanceDepthMessage,
} from '@/types';

interface UseBinanceSocketReturn {
  trades: Trade[];
  orderBook: OrderBookData;
  isConnected: boolean;
  error: string | null;
}

// WebSocket base endpoints (will try in order)
const WS_BASES: string[] = [
  // Allow override via env (must start with NEXT_PUBLIC_ to be exposed to client)
  (typeof process !== 'undefined' ? (process as any).env?.NEXT_PUBLIC_BINANCE_WS_BASE : undefined) || '',
  'wss://stream.binance.com:9443',
  'wss://stream.binance.com',
  // Regional/alt options
  'wss://stream.binance.us:9443',
  'wss://stream.binance.us',
  // Testnet (for development fallback)
  'wss://testnet.binance.vision',
].filter(Boolean);

const MAX_TRADES = 50;
const RECONNECT_DELAY = 3000;

export const useBinanceSocket = (symbol: string = 'btcusdt'): UseBinanceSocketReturn => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookData>({
    bids: new Map(),
    asks: new Map(),
    lastUpdateId: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const wsBaseIndexRef = useRef<number>(0);
  const wsFailureCountRef = useRef<number>(0);
  const sseAbortRef = useRef<AbortController | null>(null);

  const getCurrentWsBase = useCallback(() => {
    // Safety: ensure we always have at least one base
    const bases = WS_BASES.length > 0 ? WS_BASES : ['wss://stream.binance.com:9443'];
    const idx = Math.max(0, Math.min(wsBaseIndexRef.current, bases.length - 1));
    return bases[idx];
  }, []);

  const handleTradeMessage = useCallback((data: BinanceTradeMessage) => {
    const newTrade: Trade = {
      id: data.t.toString(),
      price: data.p,
      quantity: data.q,
      time: data.T,
      isBuyerMaker: data.m,
    };

    setTrades((prevTrades) => {
      const updated = [newTrade, ...prevTrades];
      return updated.slice(0, MAX_TRADES);
    });
  }, []);

  const handleDepthMessage = useCallback((data: BinanceDepthMessage) => {
    setOrderBook((prev) => {
      const newBids = new Map(prev.bids);
      const newAsks = new Map(prev.asks);

      // Update bids
      data.b.forEach(([price, quantity]) => {
        if (parseFloat(quantity) === 0) {
          newBids.delete(price);
        } else {
          newBids.set(price, quantity);
        }
      });

      // Update asks
      data.a.forEach(([price, quantity]) => {
        if (parseFloat(quantity) === 0) {
          newAsks.delete(price);
        } else {
          newAsks.set(price, quantity);
        }
      });

      return {
        bids: newBids,
        asks: newAsks,
        lastUpdateId: data.u,
      };
    });
  }, []);

  const connect = useCallback(() => {
    try {
      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Close existing connections
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Reset order book when connecting to new symbol
      setOrderBook({
        bids: new Map(),
        asks: new Map(),
        lastUpdateId: 0,
      });
      setTrades([]);

  // Use combined streams - more reliable
  const streams = `${symbol.toLowerCase()}@aggTrade/${symbol.toLowerCase()}@depth@100ms`;
  const base = getCurrentWsBase();
  const wsUrl = `${base}/stream?streams=${streams}`;
      
  console.log('Connecting to Binance WS:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully!');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          
          // Combined streams wrap data in a 'data' field
          const message = response.data;
          
          if (!message) {
            console.warn('No data in message:', response);
            return;
          }

          if (message.e === 'aggTrade') {
            console.log('📊 Trade received:', message.p);
            handleTradeMessage(message as BinanceTradeMessage);
          } else if (message.e === 'depthUpdate') {
            console.log('📈 Depth update received');
            handleDepthMessage(message as BinanceDepthMessage);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError(`Failed to connect to Binance WS at ${getCurrentWsBase()}`);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason || 'No reason provided');
        setIsConnected(false);

        // Cycle to the next base endpoint on abnormal closure
        if (event.code === 1006 || event.code === 1001 || event.code === 1002) {
          wsBaseIndexRef.current = (wsBaseIndexRef.current + 1) % (WS_BASES.length || 1);
          console.warn('Switching WS base to:', getCurrentWsBase());
          wsFailureCountRef.current += 1;
        }

        // Attempt to reconnect after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          // After a few WS failures, fallback to SSE proxy
          if (wsFailureCountRef.current >= Math.min(WS_BASES.length + 1, 4)) {
            console.warn('Falling back to SSE proxy /api/market/stream');
            startSSE();
          } else {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }
        }, RECONNECT_DELAY);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [symbol, handleTradeMessage, handleDepthMessage]);

  useEffect(() => {
    // Reset to first WS base when symbol changes
    wsBaseIndexRef.current = 0;
    wsFailureCountRef.current = 0;
    // Connect to WebSocket
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (sseAbortRef.current) {
        sseAbortRef.current.abort();
        sseAbortRef.current = null;
      }
    };
  }, [connect]);

  // Server-Sent Events fallback via Next.js proxy
  const startSSE = useCallback(() => {
    try {
      // Clean up existing WS
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }

      // Abort any previous SSE
      if (sseAbortRef.current) {
        sseAbortRef.current.abort();
      }
      const controller = new AbortController();
      sseAbortRef.current = controller;

      const url = `/api/market/stream?symbol=${encodeURIComponent(symbol)}`;
      const es = new EventSource(url);

      es.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      es.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.e === 'aggTrade') {
            handleTradeMessage(msg as BinanceTradeMessage);
          } else if (msg.e === 'depthUpdate') {
            handleDepthMessage(msg as BinanceDepthMessage);
          }
        } catch (e) {
          // ignore
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        setError('SSE connection error');
        es.close();
      };

      // Cleanup when aborted
      controller.signal.addEventListener('abort', () => {
        es.close();
      });
    } catch (e) {
      setError('Failed to start SSE fallback');
    }
  }, [symbol, handleTradeMessage, handleDepthMessage]);

  return {
    trades,
    orderBook,
    isConnected,
    error,
  };
};
