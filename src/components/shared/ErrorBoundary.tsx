'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * React错误边界组件
 * 用于捕获子组件中的JavaScript错误，并显示友好的错误界面
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state以显示错误UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary捕获到错误:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              出现了一个错误
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>抱歉，应用程序遇到了一个意外错误。</p>
              <p>您可以尝试刷新页面或重新操作。</p>
            </div>
            
            {/* 开发环境下显示详细错误信息 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-muted rounded-lg">
                <summary className="cursor-pointer font-medium text-sm">
                  错误详情 (开发模式)
                </summary>
                <div className="mt-2 text-xs font-mono text-destructive">
                  <p><strong>错误:</strong> {this.state.error.message}</p>
                  <p><strong>堆栈:</strong></p>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p><strong>组件堆栈:</strong></p>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="default" 
                size="sm"
              >
                刷新页面
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}