'use client';

import { useState, useCallback } from 'react';
import { useTokenDeploy, type TokenConfig } from '@/hooks/useTokenDeploy';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const WETH_ADDRESS = process.env.NEXT_PUBLIC_ZCORP_TOKEN_ADDRESS as `0x${string}`; // Using WETH for demo

function TokenLaunchFormInner() {
  const { deployToken, simulateDeployment, isDeploying, isSimulating } = useTokenDeploy();
  
  const [formData, setFormData] = useState<TokenConfig>({
    name: '',
    symbol: '',
    image: '',
    description: '',
    pool: {
      pairedToken: WETH_ADDRESS || '',
      positions: 'Standard',
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof TokenConfig],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSimulate = async () => {
    try {
      const result = await simulateDeployment(formData);
      console.log('Simulation result:', result);
      alert('Simulation successful! Check console for details.');
    } catch (error) {
      console.error('Simulation failed:', error);
      alert(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeploy = async () => {
    try {
      const result = await deployToken(formData);
      setDeploymentResult(result);
      
      if (result.success) {
        // Reset form on success
        setFormData({
          name: '',
          symbol: '',
          image: '',
          description: '',
          pool: {
            pairedToken: WETH_ADDRESS || '',
            positions: 'Standard',
          },
        });
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const isFormValid = formData.name && formData.symbol && formData.image && formData.pool.pairedToken;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Launch Your Token</h2>
      
      {/* Deployment Result */}
      {deploymentResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          deploymentResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {deploymentResult.success ? (
            <div>
              <h3 className="font-semibold text-green-800 mb-2">🎉 Token Deployed Successfully!</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Token Address:</strong> {deploymentResult.tokenAddress}</p>
                <p><strong>Transaction:</strong> {deploymentResult.txHash}</p>
                <a 
                  href={deploymentResult.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  View on BaseScan →
                </a>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-red-800 mb-2">❌ Deployment Failed</h3>
              <p className="text-sm text-red-700">{deploymentResult.error}</p>
            </div>
          )}
          <button
            onClick={() => setDeploymentResult(null)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <form className="space-y-6">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="My Awesome Token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Symbol *
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                placeholder="MAT"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token Image URL *
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => handleInputChange('image', e.target.value)}
              placeholder="https://example.com/token-image.png or ipfs://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your token and its purpose..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Pool Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pool Configuration</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paired Token (Quote Token) *
            </label>
            <input
              type="text"
              value={formData.pool.pairedToken}
              onChange={(e) => handleInputChange('pool.pairedToken', e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Token that users will use to buy your token (default: WETH for demo)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pool Position Type
            </label>
            <select
              value={formData.pool.positions}
              onChange={(e) => handleInputChange('pool.positions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Standard">Standard (Wide range)</option>
              <option value="Project">Project (Narrow range, higher fees)</option>
            </select>
          </div>
        </div>

        {/* Advanced Features Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            <span className="ml-2">Advanced Features (Optional)</span>
          </button>
        </div>

        {/* Advanced Features */}
        {showAdvanced && (
          <div className="space-y-6 border-t pt-6">
            {/* Vault Configuration */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Token Vesting Vault</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vault Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.vault?.percentage || ''}
                    onChange={(e) => handleInputChange('vault.percentage', parseInt(e.target.value) || 0)}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lockup Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.vault?.lockupDuration ? formData.vault.lockupDuration / 86400 : ''}
                    onChange={(e) => handleInputChange('vault.lockupDuration', (parseInt(e.target.value) || 0) * 86400)}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vesting Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.vault?.vestingDuration ? formData.vault.vestingDuration / 86400 : ''}
                    onChange={(e) => handleInputChange('vault.vestingDuration', (parseInt(e.target.value) || 0) * 86400)}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Fee Configuration */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Fee Configuration</h4>
              <select
                value={typeof formData.fees === 'string' ? formData.fees : 'DynamicBasic'}
                onChange={(e) => handleInputChange('fees', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DynamicBasic">Dynamic Basic (Recommended)</option>
                <option value="StaticBasic">Static Basic</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={!isFormValid || isSimulating}
            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSimulating ? 'Simulating...' : 'Simulate Deployment'}
          </button>
          
          <button
            type="button"
            onClick={handleDeploy}
            disabled={!isFormValid || isDeploying}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeploying ? 'Deploying...' : 'Deploy Token as ZCORP'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Form-specific error fallback
function FormErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-red-600">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-red-900">
          Token Launch Form Error
        </h3>
      </div>
      <p className="text-red-800 mb-4">
        There was an error with the token deployment form. This might be due to invalid form data, network issues, or a problem with the smart contract interaction.
      </p>
      <div className="space-x-3">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reset Form
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="text-sm text-red-600 cursor-pointer">
            Error Details (Development)
          </summary>
          <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

// Wrapped export with error boundary
export function TokenLaunchForm() {
  return (
    <ErrorBoundary fallback={FormErrorFallback}>
      <TokenLaunchFormInner />
    </ErrorBoundary>
  );
}