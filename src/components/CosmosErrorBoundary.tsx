import { Component, type ReactNode } from "react";
import { timelineStore } from "../store/timeline-store";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * The cosmos background is a "nice to have" visual layer, not load-bearing content — if the
 * lazy chunk fails to fetch (flaky network, an extension blocking it) or WebGL init throws
 * (context-limit exceeded, a driver hiccup), the rest of the site must keep working instead
 * of the whole tree crashing with no recovery. Previously an error here had no boundary at
 * all, so it stayed broken until the user manually refreshed the page.
 */
export default class CosmosErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("CosmosBackground failed to load; continuing without it.", error);
    // The Loader waits on this flag — an unrecovered background must not hang it forever.
    timelineStore.getState().setBackgroundReady(true);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
