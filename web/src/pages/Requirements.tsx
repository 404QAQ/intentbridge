import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiService, { Requirement } from '../services/api';

function Requirements() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'implementing' | 'done'>('all');

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      const data = await apiService.getRequirements();
      setRequirements(data);
    } catch (error) {
      console.error('Failed to load requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequirements = requirements.filter(
    (req) => filter === 'all' || req.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'implementing':
        return 'bg-yellow-100 text-yellow-700';
      case 'active':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Requirements</h1>
        <div className="flex items-center space-x-2">
          {(['all', 'draft', 'active', 'implementing', 'done'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Requirements List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {filteredRequirements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No requirements found</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredRequirements.map((req) => (
              <li key={req.id}>
                <Link
                  to={`/requirements/${req.id}`}
                  className="block hover:bg-gray-50 px-6 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-primary-600">
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
                      <div className="mt-1 text-lg font-medium text-gray-900">
                        {req.title}
                      </div>
                      <div className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {req.description}
                      </div>
                      {req.tags && req.tags.length > 0 && (
                        <div className="mt-2 flex items-center space-x-2">
                          {req.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-sm text-gray-500">
                      {req.files.length > 0 && (
                        <span>{req.files.length} files</span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Requirements;
