import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

let players = {};     // { socketId: { name: string; bestTime: number | null } }
let inRace = false;

io.on('connection', socket => {
  console.log('↔️ Connection:', socket.id);

  // 1) Register player, initialize bestTime to null
  socket.on('join', name => {
    players[socket.id] = { name, bestTime: null };
    io.emit('playersUpdate', players);
  });

  // 2) Handle reaction submission
  socket.on('react', reactionTime => {
    if (!inRace || !players[socket.id]) return;

    const current = players[socket.id].bestTime;
    players[socket.id].bestTime =
      current === null
        ? reactionTime
        : Math.min(current, reactionTime);

    io.emit('playersUpdate', players);
  });

  // 3) Clean up on disconnect
  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playersUpdate', players);
  });
}); // ← Make sure this closes your connection handler!

// 4) Race loop
async function raceLoop() {
  while (true) {
    inRace = false;
    io.emit('status', { phase: 'waiting' });
    const delay = 2000 + Math.random() * 3000;
    await new Promise(r => setTimeout(r, delay));

    inRace = true;
    io.emit('status', { phase: 'go', timestamp: Date.now() });

    // give everyone 3s to click
    await new Promise(r => setTimeout(r, 3000));
  }
}
raceLoop();

httpServer.listen(8080, () => console.log('🚀 Server listening on :8080'));
