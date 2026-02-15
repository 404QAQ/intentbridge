import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService, {
  ExecutionStatus,
  ConversationMessage,
  DemoStatus,
} from '../services/api';
import { StatusPanel } from '../components/chat/StatusPanel';
import { ChatInterface } from '../components/chat/ChatInterface';

function ProjectChat() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<ExecutionStatus | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (projectId: string) => {
    try {
      setLoading(true);
      const [statusData, messagesData, demo] = await Promise.all([
        apiService.getProjectStatus(projectId),
        apiService.getConversationHistory(projectId),
        apiService.getDemoStatus(projectId),
      ]);
      setStatus(statusData);
      setMessages(messagesData);
      setDemoStatus(demo);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!id) return;

    // Optimistically add user message
    const userMessage: ConversationMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setSending(true);
    setStreamingMessage('');

    try {
      await apiService.sendChatMessage(
        id,
        message,
        (chunk) => {
          // Handle streaming chunk
          setStreamingMessage((prev) => prev + chunk);
        },
        () => {
          // Handle completion
          setStreamingMessage('');
          setSending(false);
          // Reload messages to get the persisted versions
          loadData(id!);
        },
        (error) => {
          // Handle error
          console.error('Chat error:', error);
          setSending(false);
          setStreamingMessage('');
          alert(`Failed to send message: ${error.message}`);
        }
      );
    } catch (error) {
      console.error('Send message error:', error);
      setSending(false);
      setStreamingMessage('');
    }
  };

  const handleClearHistory = async () => {
    if (!id) return;

    if (window.confirm('Are you sure you want to clear the conversation history?')) {
      try {
        await apiService.clearConversation(id);
        setMessages([]);
      } catch (error) {
        console.error('Failed to clear history:', error);
        alert('Failed to clear conversation history');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Project Status & Chat
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor execution and chat with Claude about project requirements
            </p>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {demoStatus?.demoMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Demo Mode Active
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{demoStatus.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '600px' }}>
        {/* Status Panel */}
        <div className="lg:col-span-1">
          {status && (
            <StatusPanel
              status={status.status}
              currentTask={status.currentTask}
              progress={status.progress}
              logs={status.logs}
            />
          )}
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <ChatInterface
            messages={messages}
            isLoading={sending}
            streamingMessage={streamingMessage}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleSendMessage('What are the current requirements for this project?')}
            disabled={sending}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
          >
            <div className="font-medium">View Requirements</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              List all project requirements
            </div>
          </button>
          <button
            onClick={() => handleSendMessage('What is the current implementation progress?')}
            disabled={sending}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
          >
            <div className="font-medium">Check Progress</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review implementation status
            </div>
          </button>
          <button
            onClick={() => handleSendMessage('What are the next steps for this project?')}
            disabled={sending}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
          >
            <div className="font-medium">Next Steps</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Get recommendations for next actions
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectChat;
