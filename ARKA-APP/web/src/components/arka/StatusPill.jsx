import React from 'react';
import { CheckCircle, Clock, Pause, AlertCircle, XCircle, PlayCircle } from 'lucide-react';

const StatusPill = ({ status, size = 'md' }) => {
  const configs = {
    running: {
      icon: PlayCircle,
      label: 'En cours',
      className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    completed: {
      icon: CheckCircle,
      label: 'Terminé',
      className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    gated: {
      icon: Clock,
      label: 'En attente',
      className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    paused: {
      icon: Pause,
      label: 'Pause',
      className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    },
    failed: {
      icon: XCircle,
      label: 'Échoué',
      className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
    },
    pending: {
      icon: AlertCircle,
      label: 'En attente',
      className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    },
    active: {
      icon: CheckCircle,
      label: 'Actif',
      className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    idle: {
      icon: Clock,
      label: 'Inactif',
      className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
    }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border font-medium ${config.className} ${sizeClasses[size]}`}>
      <Icon size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />
      {config.label}
    </span>
  );
};

export default StatusPill;
