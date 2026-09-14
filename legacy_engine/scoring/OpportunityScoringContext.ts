export interface OpportunityScoringContext {
  /**
   * The core opportunity record being scored.
   */
  opportunity: any; // Mapped to the 'opportunities' table
  opportunity_id?: string;

  /**
   * The account linked to the opportunity.
   */
  account: any; // Mapped to the 'accounts' table

  /**
   * All contacts associated with the account/opportunity.
   */
  contacts: any[]; // Mapped to the 'contacts' table

  /**
   * All activities logged against the opportunity or its contacts.
   */
  activities: any[]; // Mapped to the 'activities' table

  /**
   * All tasks linked to the opportunity.
   */
  tasks: any[]; // Mapped to the 'tasks' table

  /**
   * Technical/Business requirements mapped to the opportunity.
   */
  requirements: any[]; // Mapped to the 'requirements' table

  /**
   * Key stakeholders mapped to the opportunity.
   */
  stakeholders: any[]; // Mapped to the 'stakeholders' table

  /**
   * Active signals evaluated in Phase 4B.
   */
  activeSignals?: any[];
}
