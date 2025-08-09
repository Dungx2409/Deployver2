const WebSocket = require('ws');

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  const clients = [];

  wss.on('connection', ws => {
    clients.push(ws);
    ws.on('close', () => {
      const i = clients.indexOf(ws);
      if (i > -1) clients.splice(i, 1);
    });
  });

  return clients;
}

module.exports = { setupWebSocket };
