'use client';

interface DisabledOverlayProps {
  isDisabled: boolean;
  reason?: string;
  action?: {
    text: string;
    onClick?: () => void;
    href?: string;
  };
  children: React.ReactNode;
}

export function DisabledOverlay({ 
  isDisabled, 
  reason = 'This feature is currently unavailable',
  action,
  children 
}: DisabledOverlayProps) {
  if (!isDisabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Original content with reduced opacity */}
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <div className="text-center p-6 max-w-md">
          <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-500 text-xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Feature Locked
          </h3>
          <p className="text-gray-600 mb-4">
            {reason}
          </p>
          {action && (
            action.href ? (
              <a
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {action.text}
                <span className="ml-2">↗</span>
              </a>
            ) : (
              <button
                onClick={action.onClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {action.text}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}