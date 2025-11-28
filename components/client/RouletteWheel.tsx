'use client';

import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface Prize {
  id: string;
  name: string;
  color: string;
}

interface RouletteWheelProps {
  prizes: Prize[];
  onSpinComplete: (prizeId: string) => void;
  spinAngle?: number;
  spinSegment?: number;
  disabled?: boolean;
}

export default function RouletteWheel({
  prizes,
  onSpinComplete,
  spinAngle,
  spinSegment,
  disabled = false,
}: RouletteWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const controls = useAnimation();

  // Toujours afficher 10 segments
  const TOTAL_SEGMENTS = 10;

  // Palette de couleurs pour les 10 segments
  const colorPalette = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#06B6D4', // cyan
    '#A855F7', // purple
  ];

  // Déclencher automatiquement l'animation quand spinAngle est défini
  useEffect(() => {
    if (spinAngle && !isSpinning) {
      handleSpin();
    }
  }, [spinAngle]);

  const handleSpin = async () => {
    if (isSpinning || !spinAngle || spinSegment === undefined) return;

    setIsSpinning(true);

    // Animation de rotation
    await controls.start({
      rotate: spinAngle,
      transition: {
        duration: 5,
        ease: [0.25, 0.1, 0.25, 1], // cubic-bezier
      },
    });

    // Utiliser le segment défini par le serveur
    const wonPrize = prizes[spinSegment];

    setIsSpinning(false);
    onSpinComplete(wonPrize.id);
  };

  const segmentAngle = 360 / TOTAL_SEGMENTS;

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-96 h-96">
        {/* Flèche pointeur (fixe) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
        </div>

        {/* Roulette */}
        <motion.div
          className="relative w-full h-full rounded-full shadow-2xl overflow-hidden"
          animate={controls}
          style={{ transformOrigin: 'center center' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {Array.from({ length: TOTAL_SEGMENTS }).map((_, index) => {
              const startAngle = index * segmentAngle;
              const endAngle = (index + 1) * segmentAngle;

              // Convertir en radians
              const start = (startAngle * Math.PI) / 180;
              const end = (endAngle * Math.PI) / 180;

              // Calculer les points du segment
              const x1 = 50 + 45 * Math.cos(start);
              const y1 = 50 + 45 * Math.sin(start);
              const x2 = 50 + 45 * Math.cos(end);
              const y2 = 50 + 45 * Math.sin(end);

              const largeArcFlag = segmentAngle > 180 ? 1 : 0;

              const pathData = `
                M 50 50
                L ${x1} ${y1}
                A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
              `;

              return (
                <g key={index}>
                  <path d={pathData} fill={colorPalette[index]} stroke="white" strokeWidth="0.5" />
                </g>
              );
            })}

            {/* Cercle central */}
            <circle cx="50" cy="50" r="8" fill="white" stroke="#333" strokeWidth="1" />
          </svg>
        </motion.div>

        {/* Cercle externe décoratif */}
        <div className="absolute inset-0 rounded-full border-8 border-gray-800 pointer-events-none" />
      </div>
    </div>
  );
}
