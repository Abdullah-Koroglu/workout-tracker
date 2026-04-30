"use client";

import React, { ReactNode, ReactElement } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactElement;
  onError?: (error: Error) => void;
}

interface State {
  error: Error | null;
}

/**
 * ErrorBoundary component for catching errors in specific parts of the UI.
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid #FED7AA",
            background: "rgba(254, 215, 170, 0.05)",
            padding: "16px",
            margin: "16px 0",
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            {/* Error Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(249, 115, 22, 0.1)",
                flexShrink: 0,
              }}
            >
              <AlertTriangle style={{ width: "18px", height: "18px", color: "#EA580C" }} />
            </div>

            {/* Error Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#7C2D12",
                  margin: "0 0 4px",
                }}
              >
                Bu bölümde bir hata oluştu
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#92400E",
                  margin: "0 0 8px",
                  lineHeight: "1.4",
                }}
              >
                {this.state.error.message || "Bilinmeyen bir hata meydana geldi."}
              </p>

              {/* Reset Button */}
              <button
                onClick={this.handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "white",
                  background: "#EA580C",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#C2410C";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#EA580C";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <RotateCcw style={{ width: "12px", height: "12px" }} />
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
