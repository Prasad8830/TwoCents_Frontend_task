// Global type definitions

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AppState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Binance WebSocket Types

export interface Trade {
  id: string;
  price: string;
  quantity: string;
  time: number;
  isBuyerMaker: boolean; // true = sell, false = buy
}

export interface OrderBookLevel {
  price: string;
  quantity: string;
}

export interface OrderBookData {
  bids: Map<string, string>; // price -> quantity
  asks: Map<string, string>; // price -> quantity
  lastUpdateId: number;
}

export interface ProcessedOrderBookLevel {
  price: number;
  quantity: number;
  total: number;
}

// Binance WebSocket Message Types
export interface BinanceTradeMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  b: number; // Buyer order ID
  a: number; // Seller order ID
  T: number; // Trade time
  m: boolean; // Is buyer maker (true = sell, false = buy)
  M: boolean; // Ignore
}

export interface BinanceDepthMessage {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID
  u: number; // Final update ID
  b: string[][]; // Bids [price, quantity]
  a: string[][]; // Asks [price, quantity]
}
