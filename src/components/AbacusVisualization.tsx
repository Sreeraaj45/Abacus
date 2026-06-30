import { useEffect, useState } from 'react';

interface AbacusVisualizationProps {
  number: number;
  showAnimation?: boolean;
}

export default function AbacusVisualization({ number, showAnimation = false }: AbacusVisualizationProps) {
  const [displayNumber, setDisplayNumber] = useState(0);

  useEffect(() => {
    if (showAnimation) {
      const duration = 500;
      const steps = 20;
      const increment = number / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= number) {
          setDisplayNumber(number);
          clearInterval(interval);
        } else {
          setDisplayNumber(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setDisplayNumber(number);
    }
  }, [number, showAnimation]);

  const digits = displayNumber.toString().padStart(4, '0').split('').map(Number);

  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl p-6 shadow-inner">
      <div className="flex justify-center gap-2 mb-4">
        {digits.map((digit, idx) => (
          <AbacusColumn key={idx} digit={digit} />
        ))}
      </div>
      <div className="text-center">
        <span className="text-3xl font-bold text-amber-900 font-mono">
          {displayNumber}
        </span>
      </div>
    </div>
  );
}

function AbacusColumn({ digit }: { digit: number }) {
  // Split digit into heaven (5) and earth (1-4) beads
  const heavenBead = digit >= 5;
  const earthBeads = digit % 5;

  return (
    <div className="flex flex-col items-center w-12">
      {/* Heaven beads (value 5) */}
      <div className="relative h-8 w-8 mb-2">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-6 h-5 rounded-full transition-all duration-300 ${
            heavenBead
              ? 'bg-gradient-to-br from-amber-500 to-amber-700 translate-y-0 shadow-md'
              : 'bg-gradient-to-br from-amber-400 to-amber-600 -translate-y-2 shadow'
          } border border-amber-800 flex items-center justify-center`}>
            <span className="text-xs text-white font-bold">5</span>
          </div>
        </div>
      </div>

      {/* Divider bar */}
      <div className="w-8 h-1 bg-amber-800 rounded mb-2" />

      {/* Earth beads (value 1 each) */}
      <div className="flex flex-col gap-1">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-6 h-4 rounded-full transition-all duration-300 ${
              idx < earthBeads
                ? 'bg-gradient-to-br from-amber-500 to-amber-700 translate-y-0 shadow-md'
                : 'bg-gradient-to-br from-amber-400 to-amber-600 -translate-y-1'
            } border border-amber-800 flex items-center justify-center`}
          >
            <span className="text-[10px] text-white font-bold">1</span>
          </div>
        ))}
      </div>
    </div>
  );
}
