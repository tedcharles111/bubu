import { useState, useEffect, useCallback, useRef } from 'react';

type GamepadHandler = (gamepad: Gamepad, prevButtons: Record<string, boolean>, currentButtons: Record<string, boolean>, prevAxes: Record<string, number>, currentAxes: Record<string, number>) => void;

export const useGamepad = (handler?: GamepadHandler) => {
  const [gamepad, setGamepad] = useState<Gamepad | null>(null);
  const [buttons, setButtons] = useState<Record<string, boolean>>({});
  const [axes, setAxes] = useState<Record<string, number>>({});

  const prevButtonsRef = useRef<Record<string, boolean>>({});
  const prevAxesRef = useRef<Record<string, number>>({});
  const animationFrameId = useRef<number | null>(null);

  const updateGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const activeGamepad = gamepads[0]; // Assuming first connected gamepad

    if (activeGamepad) {
      setGamepad(activeGamepad);

      const currentButtons: Record<string, boolean> = {};
      activeGamepad.buttons.forEach((button, index) => {
        currentButtons[`button${index}`] = button.pressed;
      });

      const currentAxes: Record<string, number> = {};
      activeGamepad.axes.forEach((axis, index) => {
        currentAxes[`axis${index}`] = axis;
      });

      // Call handler if provided
      if (handler) {
        handler(activeGamepad, prevButtonsRef.current, currentButtons, prevAxesRef.current, currentAxes);
      }

      setButtons(currentButtons);
      setAxes(currentAxes);

      prevButtonsRef.current = currentButtons;
      prevAxesRef.current = currentAxes;
    } else {
      setGamepad(null);
      setButtons({});
      setAxes({});
      prevButtonsRef.current = {};
      prevAxesRef.current = {};
    }

    animationFrameId.current = requestAnimationFrame(updateGamepad);
  }, [handler]);

  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad);
      setGamepad(e.gamepad);
      animationFrameId.current = requestAnimationFrame(updateGamepad);
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad);
      setGamepad(null);
      setButtons({});
      setAxes({});
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    const initialGamepads = navigator.getGamepads();
    if (initialGamepads[0]) {
        setGamepad(initialGamepads[0]);
        animationFrameId.current = requestAnimationFrame(updateGamepad);
    } else {
        animationFrameId.current = requestAnimationFrame(updateGamepad);
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateGamepad]);

  return { gamepad, buttons, axes };
};