import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="card p-10 text-center">
          <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">页面出现错误</h2>
          <p className="text-sm text-dark-400 mb-4 max-w-md mx-auto">
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={this.handleRetry} className="btn-primary inline-flex items-center gap-2">
              <RefreshCw size={16} /> 重试
            </button>
            <button onClick={() => window.location.href = '/'} className="btn-secondary">
              返回首页
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
