"use client";

import React, { Component, type ReactNode } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] px-4 py-12">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
            <FiAlertTriangle size={24} className="text-rose-400" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">Something went wrong</h2>
          <p className="text-sm text-zinc-500 mb-6 text-center max-w-sm">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/15 text-indigo-400 rounded-xl text-sm font-medium border border-indigo-500/20 hover:bg-indigo-500/25 transition-all"
          >
            <FiRefreshCw size={14} />
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function QueryErrorResetBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
