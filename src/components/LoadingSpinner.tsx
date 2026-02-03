import type { FC } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ size = 40, className = '' }) => (
  <div className={`loading-spinner ${className}`} role="status" aria-label="Loading">
    <Loader2 size={size} className="loading-spinner__icon" />
  </div>
);

export default LoadingSpinner;
