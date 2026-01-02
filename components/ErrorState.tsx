import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  showFallbackNote?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  showFallbackNote = true,
}) => (
  <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center">
    <AlertCircle className="w-10 h-10 text-orange-400 mb-4 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
    <p className="text-zinc-300 text-sm mb-4 text-center max-w-md">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/10"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="text-sm">Retry</span>
      </button>
    )}
    {showFallbackNote && (
      <p className="text-zinc-600 text-xs mt-4">Using simulated data</p>
    )}
  </div>
);

export default ErrorState;
