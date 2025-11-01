# 2CentsCapital - Real-Time Order Book Visualizer

A high-performance, real-time stock order book visualizer built with Next.js, connecting to the live Binance WebSocket API to stream and display market data.

## 🚀 Features

- **Live WebSocket Connection**: Real-time data streaming from Binance API
- **Order Book Visualization**: Two-column layout displaying Bids and Asks with:
  - Price, Amount, and Cumulative Total columns
  - Depth visualization with background bars
  - Live spread calculation and display
  - Top 20 price levels for each side
- **Recent Trades Display**: Shows 50 most recent trades with:
  - Flash animations for new trades (green for buys, red for sells)
  - Price, amount, and timestamp information
- **Symbol Switching**: Toggle between BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT, and XRP/USDT
- **Connection Status**: Visual indicator of WebSocket connection state
- **Performance Optimized**: Uses React.memo, useMemo, and useCallback for efficient rendering

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useReducer, useContext)
- **API**: Binance WebSocket API (live market data)

## 📦 Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## 🏃 Running the Project

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Connectivity notes (Binance WS blocked?)

If your network or region blocks Binance WebSockets, this app now:

- Tries multiple Binance WS endpoints automatically (binance.com/.us, ports 9443/443, testnet)
- Falls back to a built-in server-side SSE proxy at `/api/market/stream` if WS cannot connect

You can manually force a specific WS base via `.env.local`:

```
# Create frontend/.env.local with one of the following
NEXT_PUBLIC_BINANCE_WS_BASE=wss://stream.binance.com:9443
# or
NEXT_PUBLIC_BINANCE_WS_BASE=wss://stream.binance.com
# or
NEXT_PUBLIC_BINANCE_WS_BASE=wss://stream.binance.us:9443
# or
NEXT_PUBLIC_BINANCE_WS_BASE=wss://testnet.binance.vision
```

After editing `.env.local`, restart the dev server.

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with AppProvider
│   │   ├── page.tsx             # Main trading dashboard
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── trading/
│   │   │   ├── OrderBook.tsx          # Order book component
│   │   │   ├── RecentTrades.tsx       # Recent trades component
│   │   │   ├── SymbolSelector.tsx     # Symbol switching
│   │   │   └── ConnectionStatus.tsx   # WebSocket status
│   │   ├── common/              # Reusable UI components
│   │   └── layout/              # Layout components
│   ├── hooks/
│   │   ├── useBinanceSocket.ts  # Custom WebSocket hook
│   │   └── useAppContext.ts     # Context hook
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── contexts/
│   │   └── AppContext.tsx       # Global state context
│   ├── reducers/
│   │   └── appReducer.ts        # Reducer logic
│   └── utils/                   # Utility functions
```

## 🔧 Design Decisions & Trade-offs

### WebSocket Implementation
- **Custom Hook (`useBinanceSocket`)**: Encapsulates WebSocket logic for reusability and clean separation of concerns
- **Automatic Reconnection**: Implements 3-second delay reconnection on disconnect for resilience
- **Combined Stream**: Uses Binance's combined stream feature to subscribe to both trades and depth updates in a single connection

### State Management
- **Maps for Order Book**: Using `Map<string, string>` for O(1) price level updates instead of arrays
- **Immutable Updates**: Creating new Map instances on each update to trigger React re-renders properly
- **Limited Display**: Showing top 20 levels to maintain performance while providing sufficient market depth

### Performance Optimizations
- **React.memo**: Wrapping components to prevent unnecessary re-renders
- **useMemo**: Caching expensive calculations (sorting, cumulative totals, max values)
- **useCallback**: Memoizing WebSocket message handlers
- **Efficient Sorting**: Sorting only displayed levels (top 20) instead of entire book

### UI/UX Choices
- **Depth Visualization**: Background bars show relative depth at each price level
- **Flash Animations**: 500ms flash on new trades for clear visual feedback
- **Responsive Grid**: Layout adapts to screen size (stacked on mobile, side-by-side on desktop)
- **Color Coding**: Green for bids/buys, red for asks/sells (industry standard)

### Trade-offs Made
1. **Limited Price Levels**: Displaying 20 levels instead of full book for better performance
2. **Client-Side Processing**: Processing deltas on client instead of server for real-time responsiveness
3. **No Order Book Snapshot**: Starting from first delta update instead of fetching full snapshot (could be improved)

## 📊 API Integration

The application connects to two Binance WebSocket streams:

1. **Aggregate Trades** (`@aggTrade`): For recent trade events
2. **Depth Updates** (`@depth@100ms`): For order book delta updates at 100ms intervals

WebSocket URL format:
```
wss://stream.binance.com:9443/ws/{symbol}@aggTrade/{symbol}@depth@100ms
```

## 🚀 Deployment

This project can be easily deployed to Vercel:

```bash
npm run build
```

Or deploy directly to Vercel by connecting your GitHub repository.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint