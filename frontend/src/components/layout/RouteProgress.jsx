import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Thin accent bar that animates across the top on each route change.
export function RouteProgress() {
  const location          = useLocation();
  const [width, setWidth] = useState(0);
  const [show, setShow]   = useState(false);
  const timers            = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setShow(true);
    setWidth(0);
    // ramp up, then complete + fade
    timers.current.push(setTimeout(() => setWidth(35), 20));
    timers.current.push(setTimeout(() => setWidth(72), 220));
    timers.current.push(setTimeout(() => setWidth(100), 480));
    timers.current.push(setTimeout(() => setShow(false), 700));
    return () => timers.current.forEach(clearTimeout);
  }, [location.pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] h-0.5 pointer-events-none">
      <div
        className="h-full gradient-accent transition-all duration-300 ease-out"
        style={{ width: `${width}%`, opacity: show ? 1 : 0, boxShadow: '0 0 10px rgba(255,48,64,0.6)' }}
      />
    </div>
  );
}
