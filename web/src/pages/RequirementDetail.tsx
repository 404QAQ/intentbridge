import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiService, { Requirement } from '../services/api';

function RequirementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadRequirement(id);
    }
  }, [id]);

  const loadRequirement = async (reqId: string) => {
    try {
      const data = await apiService.getRequirement(reqId);
      setRequirement(data);
    } catch (error) {
      console.error('Failed to load requirement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !requirement) return;

    setUpdating(true);
    try {
      await apiService.updateRequirementStatus(id, newStatus);
      await loadRequirement(id);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Requirement not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/requirements"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-primary-600">{requirement.id}</span>
              <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(requirement.status)}`}>
                {requirement.status}
              </span>
              <span className={`text-sm font-medium ${getPriorityColor(requirement.priority)}`}>
                {requirement.priority} priority
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{requirement.title}</h1>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center space-x-2">
          <select
            value={requirement.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="implementing">Implementing</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{requirement.description}</p>
          </div>

          {/* Acceptance Criteria */}
          {requirement.acceptance && requirement.acceptance.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acceptance Criteria</h2>
              <ul className="space-y-3">
                {requirement.acceptance.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span
                      className={`mt-1 flex-shrink-0 w-5 h-5 rounded border ${
                        item.done
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300'
                      } flex items-center justify-center`}
                    >
                      {item.done && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                    <span className={item.done ? 'text-gray-500 line-through' : 'text-gray-700'}>
                      {item.criterion}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {requirement.notes && requirement.notes.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
              <div className="space-y-4">
                {requirement.notes.map((note, index) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                    <div className="text-sm text-gray-500 mb-1">{formatDate(note.date)}</div>
                    <div className="text-gray-700 whitespace-pre-wrap">{note.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900 mt-1">{formatDate(requirement.created)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className={`text-sm font-medium mt-1 ${getPriorityColor(requirement.priority)}`}>
                  {requirement.priority.toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(requirement.status)}`}>
                    {requirement.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Tags */}
          {requirement.tags && requirement.tags.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {requirement.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {requirement.depends_on && requirement.depends_on.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dependencies</h2>
              <ul className="space-y-2">
                {requirement.depends_on.map((depId) => (
                  <li key={depId}>
                    <Link
                      to={`/requirements/${depId}`}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      {depId}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Files */}
          {requirement.files && requirement.files.length > 0 && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Files</h2>
              <ul className="space-y-2">
                {requirement.files.map((file) => (
                  <li key={file} className="text-sm text-gray-600 font-mono">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequirementDetail;
