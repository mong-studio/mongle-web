import { Component, type ErrorInfo, type ReactNode } from "react";
import { NotFound } from "../features/error/NotFound.js";
import { openConsultationMail } from "./notFoundActions.js";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * App-level error boundary. When the React tree throws, it shows the cozy
 * 404 "길을 잃어버렸어요" page as the recovery surface. Since the village app
 * has no router, a full navigation to "/" is the safest way to recover —
 * the NotFound action defaults already do exactly that.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the failure for diagnostics; the UI recovers via NotFound.
    console.error("앱에서 처리되지 않은 오류가 발생했습니다:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <NotFound onConsult={openConsultationMail} />;
    }
    return this.props.children;
  }
}
