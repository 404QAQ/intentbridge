import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { FilterPanel, FilterState } from '../components/FilterPanel';
import { ExportButton } from '../components/ExportButton';

function Requirements() {
  const { requirements, loading, error, lastUpdated, refresh } = useRealtimeUpdates({
    interval: 10000, // Update every 10 seconds
    enabled: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priority: 'all',
    search: '',
    tags: [],
  });

  // Get all unique tags
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    requirements.forEach((req) => {
      req.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [requirements]);

  // Apply all filters
  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      // Status filter
      if (filters.status !== 'all' && req.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && req.priority !== filters.priority) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          req.title.toLowerCase().includes(searchLower) ||
          req.description.toLowerCase().includes(searchLower) ||
          req.id.toLowerCase().includes(searchLower);
        if (!matchesSearch) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasAllTags = filters.tags.every((tag) => req.tags?.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }, [requirements, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'implementing':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Requirements</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
              <button
                onClick={refresh}
                className="ml-2 text-primary-600 dark:text-primary-400 hover:underline"
              >
                Refresh
              </button>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
          </button>
          <ExportButton requirements={filteredRequirements} />
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel onFilterChange={setFilters} availableTags={availableTags} />
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredRequirements.length} of {requirements.length} requirements
      </div>

      {/* Requirements List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg transition-colors">
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No requirements found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRequirements.map((req) => (
                <li key={req.id}>
                  <Link
                    to={`/requirements/${req.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 px-6 py-4 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {req.id}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              req.status
                            )}`}
                          >
                            {req.status}
                          </span>
                          <span
                            className={`text-xs font-medium ${getPriorityColor(
                              req.priority
                            )}`}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <div className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                          {req.title}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {req.description}
                        </div>
                        {req.tags && req.tags.length > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            {req.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                        {req.files.length > 0 && <span>{req.files.length} files</span>}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Requirements;
