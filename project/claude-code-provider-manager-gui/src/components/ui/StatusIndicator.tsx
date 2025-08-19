import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

type StatusType = 'success' | 'error' | 'warning' | 'loading' | 'unknown';

interface StatusIndicatorProps {
  status: StatusType;
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
  loading: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  unknown: {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  className = '',
  size = 'md',
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const iconSizeClass = sizeClasses[size];

  return (
    <div className={`inline-flex items-center space-x-2 ${config.bgColor} ${config.borderColor} border rounded-full px-3 py-1 ${className}`}>
      <Icon className={`${iconSizeClass} ${config.color}`} />
      {text && (
        <span className={`text-sm font-medium ${config.color}`}>
          {text}
        </span>
      )}
    </div>
  );
};