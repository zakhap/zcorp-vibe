'use client';

import { ConnectButton } from './ConnectButton';
import { WETHWrapper } from './WETHWrapper';

export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected-loading'
  | 'connected-unqualified'
  | 'connected-qualified'
  | 'error';

interface StatusBarProps {
  status: ConnectionStatus;
  balance?: string;
  symbol?: string;
  minRequired?: string;
  error?: string;
  onRetry?: () => void;
  onBalanceUpdate?: () => void;
  address?: string;
}

export function StatusBar({ 
  status, 
  balance, 
  symbol = 'WETH', 
  minRequired = '0.01',
  error,
  onRetry,
  onBalanceUpdate,
  address 
}: StatusBarProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'disconnected':
        return {
          type: 'info' as const,
          icon: '🔗',
          title: 'Connect Your Wallet',
          message: 'Connect your wallet to start deploying tokens as ZCORP',
          showConnect: true,
        };
      
      case 'connecting':
        return {
          type: 'info' as const,
          icon: '⚡',
          title: 'Connecting...',
          message: 'Please confirm the connection in your wallet',
          showConnect: false,
        };
      
      case 'connected-loading':
        return {
          type: 'info' as const,
          icon: '🔄',
          title: 'Checking Eligibility',
          message: `Verifying your ${symbol} balance...`,
          showConnect: false,
          loading: true,
        };
      
      case 'connected-unqualified':
        return {
          type: 'warning' as const,
          icon: '⚠️',
          title: 'Insufficient Balance',
          message: `You need at least ${minRequired} ${symbol} to deploy tokens. Current balance: ${balance || '0'} ${symbol}`,
          showConnect: false,
          showWETHWrapper: true,
        };
      
      case 'connected-qualified':
        return {
          type: 'success' as const,
          icon: '✅',
          title: 'Ready to Deploy',
          message: `You're qualified with ${balance} ${symbol}. You can now deploy tokens as ZCORP.`,
          showConnect: false,
        };
      
      case 'error':
        return {
          type: 'error' as const,
          icon: '❌',
          title: 'Connection Error',
          message: error || 'Something went wrong. Please try again.',
          showConnect: false,
          action: onRetry ? {
            text: 'Retry',
            onClick: onRetry,
          } : undefined,
        };
      
      default:
        return {
          type: 'info' as const,
          icon: '🔗',
          title: 'Connect Your Wallet',
          message: 'Connect your wallet to get started',
          showConnect: true,
        };
    }
  };

  const config = getStatusConfig();
  
  const getBackgroundColor = () => {
    switch (config.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (config.type) {
      case 'success': return 'text-green-900';
      case 'warning': return 'text-yellow-900';
      case 'error': return 'text-red-900';
      default: return 'text-blue-900';
    }
  };

  const getMessageColor = () => {
    switch (config.type) {
      case 'success': return 'text-green-800';
      case 'warning': return 'text-yellow-800';
      case 'error': return 'text-red-800';
      default: return 'text-blue-800';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getBackgroundColor()}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {config.loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : (
              <span className="text-xl">{config.icon}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold ${getTextColor()}`}>
              {config.title}
            </h3>
            <p className={`text-sm ${getMessageColor()} break-words overflow-wrap-anywhere`}>
              {config.message}
            </p>
            {address && status !== 'disconnected' && (
              <p className="text-xs text-gray-600 mt-1 break-all">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 flex-shrink-0">
          {config.action && (
            config.action.href ? (
              <a
                href={config.action.href}
                target={config.action.external ? '_blank' : '_self'}
                rel={config.action.external ? 'noopener noreferrer' : undefined}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                {config.action.text}
              </a>
            ) : (
              <button
                onClick={config.action.onClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                {config.action.text}
              </button>
            )
          )}
          
          {config.showConnect && (
            <ConnectButton />
          )}
        </div>
      </div>
      
      {config.showWETHWrapper && (
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <WETHWrapper onSuccess={onBalanceUpdate}>
            <a
              href="https://app.uniswap.org/swap?outputCurrency=0x4200000000000000000000000000000000000006&chain=base"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Use Uniswap →
            </a>
          </WETHWrapper>
        </div>
      )}
    </div>
  );
}