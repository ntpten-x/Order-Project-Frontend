"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Text, Paragraph, Title } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Following vercel-react-best-practices:
 * - Proper error handling for client components
 * - Graceful degradation with recovery options
 * 
 * Following ui-ux-pro-max:
 * - error-feedback: Clear error messages near problem
 * - loading-states: User-friendly error states
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state if resetKey changes
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    this.resetError();
    window.location.reload();
  };

  handleGoHome = () => {
    this.resetError();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div 
          className="error-boundary-container"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#f8fafc',
            fontFamily: 'var(--font-family, sans-serif)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: 32,
            padding: '48px 32px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
            maxWidth: 560,
            width: '100%',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}>
            <div style={{
              width: 80,
              height: 80,
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#ef4444',
              fontSize: 36,
              boxShadow: '0 8px 16px rgba(239, 68, 68, 0.15)',
            }}>
              <BugOutlined />
            </div>

            <Title level={3} style={{ margin: '0 0 12px', color: '#1e293b', fontWeight: 700 }}>
              ระบบแจ้งเตือนข้อผิดพลาด
            </Title>
            
            <Paragraph style={{ fontSize: 16, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
              ขออภัยในความไม่สะดวก ระบบตรวจพบความผิดปกติบางอย่าง<br/>กรุณาลองรีโหลดหน้าเว็บใหม่อีกครั้ง
            </Paragraph>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                key="retry" 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
                size="large"
                style={{ 
                  borderRadius: 16, 
                  fontWeight: 600, 
                  height: 48,
                  padding: '0 24px',
                  background: '#10b981',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  border: 'none',
                }}
              >
                ลองใหม่อีกครั้ง
              </Button>
              <Button 
                key="home" 
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
                size="large"
                style={{ 
                  borderRadius: 16, 
                  height: 48,
                  padding: '0 24px',
                  color: '#64748b',
                  borderColor: '#cbd5e1',
                }}
              >
                กลับหน้าแรก
              </Button>
            </div>

            {isDev && this.state.error && (
              <div 
                style={{ 
                  marginTop: 40, 
                  padding: 20, 
                  background: '#1e293b', 
                  borderRadius: 16,
                  textAlign: 'left',
                  color: '#e2e8f0',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid #334155', paddingBottom: 12 }}>
                  <BugOutlined style={{ color: '#ef4444' }} />
                  <Text strong style={{ color: '#f8fafc' }}>Developer Debug Info</Text>
                </div>
                <Paragraph 
                  code 
                  copyable 
                  style={{ 
                    fontSize: 13, 
                    marginBottom: 12,
                    color: '#94a3b8',
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.message}
                </Paragraph>
                {this.state.error.stack && (
                  <details>
                    <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: 12, userSelect: 'none' }}>
                      View Stack Trace
                    </summary>
                    <pre style={{ 
                      marginTop: 12,
                      overflow: 'auto', 
                      maxHeight: 200,
                      fontSize: 11,
                      background: '#0f172a',
                      padding: 12,
                      borderRadius: 8,
                      color: '#cbd5e1',
                      border: '1px solid #334155',
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with error boundary
 * Usage: export default withErrorBoundary(MyComponent)
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
