import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => (
  <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center">
    <Loader2 className="w-10 h-10 text-white animate-spin mb-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
    <p className="text-zinc-400 text-sm">{message}</p>
  </div>
);

export default LoadingState;
