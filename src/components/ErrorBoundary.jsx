import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return React.createElement("div", { style: { padding: 40, background: "#0A0E1A", minHeight: "100vh", color: "#C8102E", fontFamily: "monospace", fontSize: 14, whiteSpace: "pre-wrap" } },
        "ERRO: " + this.state.error.message + "\n\nStack:\n" + this.state.error.stack
      );
    }
    return this.props.children;
  }
}
