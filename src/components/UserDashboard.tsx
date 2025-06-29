'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Deployment {
  id: string;
  tokenAddress: string;
  txHash: string;
  tokenName: string;
  tokenSymbol: string;
  createdAt: string;
  status: string;
  explorerUrl: string;
}

interface UserStats {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  firstDeployment: string | null;
  latestDeployment: string | null;
  zcorpBalance: string;
  lastVerified: string | null;
  successRate: string;
}

interface UserDashboardProps {
  isLimited?: boolean;
  address?: string;
}

function UserDashboardInner({ isLimited = false, address: propAddress }: UserDashboardProps = {}) {
  const { address: wagmiAddress } = useAccount();
  const address = propAddress || wagmiAddress;
  
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (address && !isLimited) {
      fetchUserData();
    } else if (isLimited) {
      setIsLoading(false);
    }
  }, [address, isLimited]);

  const fetchUserData = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Fetch deployments and stats in parallel
      const [deploymentsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/tokens/deployments/${address}`),
        fetch(`${API_URL}/api/tokens/stats/${address}`)
      ]);

      if (deploymentsRes.ok) {
        const deploymentsData = await deploymentsRes.json();
        setDeployments(deploymentsData.deployments || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    return (num / 1e18).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Limited state - show placeholder content
  if (isLimited) {
    return (
      <div className="space-y-6">
        {/* Placeholder Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-400">-</div>
                <div className="text-sm text-gray-600">Total Deployments</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-400">-</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">Connect your wallet to view stats</p>
            </div>
          </div>
        </div>

        {/* Placeholder Deployments */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deployments</h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">📊</span>
            </div>
            <p className="text-gray-500 mb-2">No deployments yet</p>
            <p className="text-gray-400 text-sm">Your token deployments will appear here</p>
          </div>
        </div>

        {/* Placeholder Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <div className="w-full text-left p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed">
              <div className="font-medium text-gray-400">📊 View All Deployments</div>
              <div className="text-sm text-gray-400">Connect wallet to access</div>
            </div>
            
            <div className="w-full text-left p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed">
              <div className="font-medium text-gray-400">💰 Check WETH Balance</div>
              <div className="text-sm text-gray-400">Connect wallet to access</div>
            </div>
            
            <div className="w-full text-left p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed">
              <div className="font-medium text-gray-400">📖 View Documentation</div>
              <div className="text-sm text-gray-400">Learn about token features</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
        
        {stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalDeployments}</div>
                <div className="text-sm text-gray-600">Total Deployments</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.successRate}</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ZCORP Balance:</span>
                <span className="font-medium">{formatBalance(stats.zcorpBalance)} ZCORP</span>
              </div>
              {stats.latestDeployment && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Deployment:</span>
                  <span className="font-medium">{formatDate(stats.latestDeployment)}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center">No deployment history yet</p>
        )}
      </div>

      {/* Recent Deployments */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Deployments</h3>
          {deployments.length > 0 && (
            <button
              onClick={fetchUserData}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          )}
        </div>

        {deployments.length > 0 ? (
          <div className="space-y-3">
            {deployments.slice(0, 5).map((deployment) => (
              <div key={deployment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {deployment.tokenName} ({deployment.tokenSymbol})
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(deployment.createdAt)}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    deployment.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : deployment.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {deployment.status}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Token:</span>
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {deployment.tokenAddress.slice(0, 6)}...{deployment.tokenAddress.slice(-4)}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>TX:</span>
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {deployment.txHash.slice(0, 6)}...{deployment.txHash.slice(-4)}
                    </code>
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <a
                    href={deployment.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View on BaseScan →
                  </a>
                </div>
              </div>
            ))}
            
            {deployments.length > 5 && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  And {deployments.length - 5} more deployments...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <p className="text-gray-500 mb-2">No deployments yet</p>
            <p className="text-sm text-gray-400">
              Deploy your first token to see it here
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        
        <div className="space-y-3">
          <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-900">📊 View All Deployments</div>
            <div className="text-sm text-gray-500">See complete deployment history</div>
          </button>
          
          <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-900">💰 Check ZCORP Balance</div>
            <div className="text-sm text-gray-500">Verify current token balance</div>
          </button>
          
          <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="font-medium text-gray-900">📖 View Documentation</div>
            <div className="text-sm text-gray-500">Learn about token features</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Dashboard-specific error fallback
function DashboardErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-blue-600">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">
          Dashboard Error
        </h3>
      </div>
      <p className="text-blue-800 mb-4">
        Unable to load your dashboard data. This might be due to network connectivity issues or a temporary server problem.
      </p>
      <div className="space-x-3">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

// Wrapped export with error boundary
export function UserDashboard(props: UserDashboardProps) {
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <UserDashboardInner {...props} />
    </ErrorBoundary>
  );
}