import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';


type Player = { name: string; bestTime: number | null };
type Status = { phase: 'waiting' | 'go'; timestamp?: number };

export default function App() {
  const [socket] = useState(() => io('http://localhost:8080'));
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [status, setStatus] = useState<Status>({ phase: 'waiting' });
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const startRef = useRef<number>(0);

  // 1) Socket handlers
  useEffect(() => {
    const name = prompt('Enter your player name') || 'Anonymous';
    socket.emit('join', name);

    socket.on('playersUpdate', setPlayers);
    socket.on('status', (st: Status) => {
      setReactionTime(null);
      setStatus(st);
      if (st.phase === 'go') {
        startRef.current = st.timestamp!;
      }
    });
  }, [socket]);

  // 2) Handle click
  const handleClick = () => {
    if (status.phase !== 'go' || reactionTime !== null) return;
    const rt = Date.now() - startRef.current;
    setReactionTime(rt);
    socket.emit('react', rt);
  };

  // 3) Sort leaderboard (null times bubble to bottom)
  const leaderboard = Object.values(players)
    .sort((a, b) => (a.bestTime ?? Infinity) - (b.bestTime ?? Infinity))
    .slice(0, 5);

  return (
    <div className="p-4">
      <div
        className={`box ${status.phase}`}
          onClick={handleClick}
        >
          {status.phase === 'waiting'
            ? 'Get Ready…'
            : reactionTime === null
              ? 'GO!'
              : `${reactionTime} ms`}
      </div>

      <h2 className="mt-4 text-xl">Leaderboard</h2>
      <ul className="list-decimal list-inside">
        {leaderboard.map((p, i) => (
          <li key={i}>
            {p.name}: {p.bestTime === null ? '—' : `${p.bestTime} ms`}
          </li>
        ))}
      </ul>
    </div>
  );
}
