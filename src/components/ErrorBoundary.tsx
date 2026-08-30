"use client";

import { Component, type ReactNode } from "react";
import { LoadFailure } from "@/components/ui/load-failure";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Last-resort fallback for the whole app shell — without this, a crash anywhere in the editor,
 *  explorer, or a panel would blank the entire page instead of leaving something the user can
 *  recover from. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <LoadFailure
          error={this.state.error}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
