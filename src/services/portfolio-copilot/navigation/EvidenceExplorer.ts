export class EvidenceExplorer {
  /**
   * Returns the raw underlying records (e.g., email transcript) that back up a graph edge.
   */
  static getEvidence(graphNodeId: string) {
    // MOCK: Resolves to the source table (e.g. signal_messages) and fetches the raw text
    return {
      source: "signal_messages",
      evidenceText: "Email transcript showing stakeholder objection."
    };
  }
}
