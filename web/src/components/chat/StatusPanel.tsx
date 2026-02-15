import { FC } from 'react';
import { LogEntry } from '../../services/api';

interface StatusPanelProps {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentTask?: string;
  progress?: number;
  logs: LogEntry[];
}

export const StatusPanel: FC<StatusPanelProps> = ({ status, currentTask, progress, logs }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Idle';
    }
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const recentLogs = logs.slice(-10).reverse();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Execution Status
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
            Current Task
          </div>
          <div className="text-sm text-blue-900 dark:text-blue-100">{currentTask}</div>
        </div>
      )}

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Logs</h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">{logs.length} total</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-64 overflow-y-auto">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No logs available
            </p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 text-xs">
                  <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={`font-medium uppercase ${getLogLevelColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
