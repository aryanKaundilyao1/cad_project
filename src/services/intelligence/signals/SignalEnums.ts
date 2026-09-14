export enum SignalSeverity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum SignalConfidence {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  UNVERIFIED = 'Unverified'
}

export enum SignalStatus {
  DETECTED = 'Detected',
  VALIDATED = 'Validated',
  ACTIVE = 'Active',
  DECAYING = 'Decaying',
  EXPIRED = 'Expired',
  ARCHIVED = 'Archived'
}

export enum SignalCategory {
  INTENT = 'Intent',
  TIMING = 'Timing',
  ENGAGEMENT = 'Engagement',
  RISK = 'Risk',
  OPPORTUNITY = 'Opportunity'
}
