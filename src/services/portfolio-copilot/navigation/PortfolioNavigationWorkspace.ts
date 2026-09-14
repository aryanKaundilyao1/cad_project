export class PortfolioNavigationWorkspace {
  /**
   * Provides the backend DTOs to power the UI Workspace (Graph Explorer, Evidence Explorer).
   */
  static getWorkspaceState(sessionId: string) {
    // MOCK: return UI state
    return {
      activeView: 'GRAPH',
      history: []
    };
  }
}
