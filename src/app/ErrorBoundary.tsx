import { Component, type ErrorInfo, type ReactNode } from "react";
import { ServerError } from "../features/error/ServerError.js";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * App-level error boundary. When the React tree throws, it shows the cozy 500
 * "마을에 잠시 문제가 생겼어요" page as the recovery surface — a crash is a
 * server/app error, distinct from the 404 shown by RouteGate for unknown paths.
 * "다시 시도하기" clears the error state to re-render the tree; if it throws
 * again, the boundary simply catches it and shows the 500 page once more.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the failure for diagnostics; the UI recovers via ServerError.
    console.error("앱에서 처리되지 않은 오류가 발생했습니다:", error, info.componentStack);
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return <ServerError onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
