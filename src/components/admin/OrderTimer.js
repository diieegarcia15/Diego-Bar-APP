'use client';
import { useState, useEffect } from 'react';

export default function OrderTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState('');
  const [urgency, setUrgency] = useState('text-accent');

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - start;
      
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      
      setElapsed(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      
      if (mins >= 10) setUrgency('text-status-danger animate-timer-pulse');
      else if (mins >= 5) setUrgency('text-status-preparing');
      else setUrgency('text-accent');
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div className={`font-mono text-lg font-bold flex items-center gap-2 ${urgency}`}>
      <span className="text-xs uppercase tracking-tighter opacity-70">En espera:</span>
      {elapsed || '00:00'}
    </div>
  );
}
