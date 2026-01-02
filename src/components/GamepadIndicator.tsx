import React from 'react';
import { motion } from 'framer-motion';

interface GamepadIndicatorProps {
  isConnected: boolean;
  buttonPressed?: string;
}

export const GamepadIndicator: React.FC<GamepadIndicatorProps> = ({ isConnected, buttonPressed }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50 pointer-events-none"
    >
      <div className="glassmorphic p-3 rounded-lg border border-red-800/50 flex items-center gap-2">
        {isConnected ? (
          <>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-rajdhani text-green-300">Gamepad Connected</span>
            {buttonPressed && (
              <span className="text-xs text-gray-400">Button: {buttonPressed.replace('button', 'B')}</span>
            )}
          </>
        ) : (
          <>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-rajdhani text-red-300">No Gamepad</span>
          </>
        )}
      </div>
    </motion.div>
  );
};