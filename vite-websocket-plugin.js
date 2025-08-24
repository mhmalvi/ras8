/**
 * Vite plugin to handle WebSocket configuration for Shopify App Bridge
 */
export default function websocketPlugin() {
  return {
    name: 'websocket-config',
    configureServer(server) {
      // Configure WebSocket support for App Bridge
      server.ws.on('connection', (socket) => {
        console.log('🔌 WebSocket connection established for App Bridge');
        
        // Handle App Bridge specific messages
        socket.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            if (message.type === 'APP_BRIDGE_PING') {
              socket.send(JSON.stringify({ type: 'APP_BRIDGE_PONG', timestamp: Date.now() }));
            }
          } catch (error) {
            // Ignore non-JSON messages
          }
        });
        
        socket.on('close', () => {
          console.log('🔌 WebSocket connection closed');
        });
        
        socket.on('error', (error) => {
          console.log('🔌 WebSocket error:', error.message);
        });
      });

      // Add middleware for WebSocket upgrade requests
      server.middlewares.use((req, res, next) => {
        if (req.headers.upgrade === 'websocket') {
          // Set headers for WebSocket upgrade
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Upgrade, Connection');
          
          // Handle secure WebSocket upgrades for ngrok tunnels
          if (req.headers['x-forwarded-proto'] === 'https') {
            res.setHeader('Sec-WebSocket-Protocol', 'wss');
          }
        }
        next();
      });
    }
  };
}