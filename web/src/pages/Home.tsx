import { useEffect, useState } from 'react';
import apiService, { GlobalStatus, Requirement } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

function Home() {
  const [status, setStatus] = useState<GlobalStatus | null>(null);
  const [recentRequirements, setRecentRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [globalStatus, requirements] = await Promise.all([
        apiService.getGlobalStatus(),
        apiService.getRequirements(),
      ]);
      setStatus(globalStatus);
      setRecentRequirements(requirements.slice(-5).reverse());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const statusData = status
    ? [
        { name: 'Done', value: status.doneRequirements },
        { name: 'Implementing', value: status.implementingRequirements },
        { name: 'Active', value: status.totalRequirements - status.doneRequirements - status.implementingRequirements },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Projects</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {status?.totalProjects || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Active Projects</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {status?.activeProjects || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Requirements</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {status?.totalRequirements || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Completion Rate</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {status && status.totalRequirements > 0
              ? Math.round((status.doneRequirements / status.totalRequirements) * 100)
              : 0}
            %
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Requirements by Priority */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Requirements</h2>
          <div className="space-y-3">
            {recentRequirements.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No requirements yet</p>
            ) : (
              recentRequirements.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">{req.title}</div>
                    <div className="text-sm text-gray-500">{req.id}</div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      req.status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : req.status === 'implementing'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
