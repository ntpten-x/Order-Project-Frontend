"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

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
            background: 'linear-gradient(180deg, #f5f5f5 0%, #fafafa 100%)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <Result
            status="error"
            title="เกิดข้อผิดพลาด"
            subTitle="ขออภัย มีบางอย่างผิดปกติ กรุณาลองใหม่อีกครั้ง"
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '40px 24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              maxWidth: 600,
              width: '100%',
            }}
            extra={[
              <Button 
                key="retry" 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
                size="large"
                style={{ borderRadius: 8, fontWeight: 500 }}
              >
                ลองใหม่อีกครั้ง
              </Button>,
              <Button 
                key="home" 
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
                size="large"
                style={{ borderRadius: 8 }}
              >
                กลับหน้าแรก
              </Button>,
            ]}
          >
            {isDev && this.state.error && (
              <div 
                style={{ 
                  marginTop: 24, 
                  padding: 16, 
                  background: '#fff2f0', 
                  borderRadius: 8,
                  border: '1px solid #ffccc7',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <BugOutlined style={{ color: '#ff4d4f' }} />
                  <Text strong style={{ color: '#ff4d4f' }}>Debug Info (Development Only)</Text>
                </div>
                <Paragraph 
                  code 
                  copyable 
                  style={{ 
                    fontSize: 12, 
                    marginBottom: 8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                </Paragraph>
                {this.state.error.stack && (
                  <details style={{ fontSize: 11, color: '#8c8c8c' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>
                      Stack Trace
                    </summary>
                    <pre style={{ 
                      overflow: 'auto', 
                      maxHeight: 200,
                      fontSize: 10,
                      background: '#fafafa',
                      padding: 8,
                      borderRadius: 4,
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </Result>
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
