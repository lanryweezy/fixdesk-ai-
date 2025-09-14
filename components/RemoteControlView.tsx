import React, { useEffect, useRef } from 'react';

export const RemoteControlView: React.FC = () => {
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === view) {
        // In a real app, you'd scale these coordinates to the remote screen size
        window.electronAPI.send('robot-mouse-move', { x: e.movementX, y: e.movementY });
      }
    };

    const handleClick = () => {
      if (document.pointerLockElement !== view) {
        view.requestPointerLock();
      } else {
        window.electronAPI.send('robot-mouse-click', null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // This is a simplified example. A real implementation would need to handle
      // special keys, modifiers (shift, ctrl, etc.), and different keyboard layouts.
      e.preventDefault();
      window.electronAPI.send('robot-key-tap', e.key);
    };

    const handlePointerLockChange = () => {
        if (document.pointerLockElement === view) {
            document.addEventListener("keydown", handleKeyDown, false);
        } else {
            document.removeEventListener("keydown", handleKeyDown, false);
        }
    }

    view.addEventListener('mousemove', handleMouseMove);
    view.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange, false);


    return () => {
      view.removeEventListener('mousemove', handleMouseMove);
      view.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  return (
    <div className="w-full h-full bg-gray-800 text-white flex flex-col items-center justify-center font-sans">
      <h2 className="text-2xl font-bold mb-4">Remote Control Session</h2>
      <div
        ref={viewRef}
        className="w-full max-w-5xl aspect-video bg-black border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer"
        tabIndex={0} // Make it focusable
      >
        <p className="text-gray-300 text-lg">Click here to start controlling the remote machine.</p>
        <p className="text-gray-500 text-sm mt-2">(Press 'Esc' to release control)</p>
      </div>
       <div className="mt-4 p-4 bg-gray-900 rounded-lg text-sm max-w-5xl w-full">
            <h3 className="font-bold mb-2">Instructions:</h3>
            <ul className="list-disc list-inside text-gray-400">
                <li>Click on the black screen area to capture your mouse and keyboard.</li>
                <li>Once captured, your inputs will be sent to the remote machine.</li>
                <li>Press the `Esc` key to release control and return to the application.</li>
            </ul>
        </div>
    </div>
  );
};
