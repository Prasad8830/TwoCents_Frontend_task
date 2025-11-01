import type { NextRequest } from 'next/server';
import WebSocket from 'ws';

export const runtime = 'nodejs';

// Try multiple bases on the server as well; allow server env override
const SERVER_WS_BASES: string[] = [
  process.env.BINANCE_WS_BASE || '',
  process.env.NEXT_PUBLIC_BINANCE_WS_BASE || '',
  'wss://stream.binance.com:9443',
  'wss://stream.binance.com',
  'wss://testnet.binance.vision',
].filter(Boolean);

function pickBase(index = 0) {
  const bases = SERVER_WS_BASES.length > 0 ? SERVER_WS_BASES : ['wss://stream.binance.com:9443'];
  return bases[index % bases.length];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'btcusdt').toLowerCase();

  let ws: WebSocket | null = null;
  let baseIndex = 0;

  const encoder = new TextEncoder();
  const keepAliveMs = 15000;
  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const connectWs = () => {
        const base = pickBase(baseIndex);
        const streams = `${symbol}@aggTrade/${symbol}@depth@100ms`;
        const url = `${base}/stream?streams=${streams}`;

        try {
          ws = new WebSocket(url);

          ws.on('open', () => {
            controller.enqueue(encoder.encode(`event: open\n`));
            controller.enqueue(encoder.encode(`data: "connected"\n\n`));
            // keep-alive comments to prevent proxies from closing
            keepAliveTimer = setInterval(() => {
              controller.enqueue(encoder.encode(`: ping\n\n`));
            }, keepAliveMs);
          });

          ws.on('message', (data: Buffer) => {
            try {
              const parsed = JSON.parse(data.toString());
              const payload = parsed.data || parsed; // combined streams wrap in data
              if (!payload) return;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
            } catch (e) {
              // skip invalid
            }
          });

          ws.on('error', () => {
            // Try next base
            baseIndex += 1;
            ws?.close();
          });

          ws.on('close', () => {
            if (keepAliveTimer) {
              clearInterval(keepAliveTimer);
              keepAliveTimer = null;
            }
            // Rotate to next base and retry once
            baseIndex += 1;
            if (baseIndex < (SERVER_WS_BASES.length || 1) + 2) {
              connectWs();
            } else {
              controller.enqueue(encoder.encode(`event: end\n`));
              controller.enqueue(encoder.encode(`data: "closed"\n\n`));
              controller.close();
            }
          });
        } catch (err) {
          // If immediate constructor error, rotate and retry
          baseIndex += 1;
          connectWs();
        }
      };

      connectWs();
    },
    cancel() {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (ws) {
        try { ws.terminate(); } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
