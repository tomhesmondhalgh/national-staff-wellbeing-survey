
import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface ScreenOrientationOverlayProps {
  onDismiss?: () => void;
}

const ScreenOrientationOverlay: React.FC<ScreenOrientationOverlayProps> = ({ onDismiss }) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissed state when component mounts
    setDismissed(false);

    // Add listener to detect orientation changes
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: landscape)").matches) {
        setDismissed(true);
      }
    };

    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-lg p-6 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <RotateCcw size={48} className="text-brandPurple-600 animate-spin-slow" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Please Rotate Your Device</h2>
        <p className="text-gray-600 mb-4">
          This page works best in landscape mode. Please rotate your device for the best experience.
        </p>
        <button
          onClick={handleDismiss}
          className="mt-4 px-4 py-2 bg-brandPurple-600 text-white rounded hover:bg-brandPurple-700 transition-colors"
        >
          Continue in Portrait Mode
        </button>
      </div>
    </div>
  );
};

export default ScreenOrientationOverlay;
