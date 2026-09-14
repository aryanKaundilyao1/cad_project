export interface BaseEntity {
  id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface Activity extends BaseEntity {
  activity_type: 'call' | 'meeting' | 'email' | 'whatsapp' | 'note' | 'system' | 'signal';
  title: string;
  description?: string;
  opportunity_id?: string;
  account_id?: string;
  contact_id?: string;
  activity_timestamp: string;
  metadata: Record<string, any>;
  created_by?: string;
}

export interface Task extends BaseEntity {
  task_type: 'follow_up' | 'proposal' | 'meeting' | 'qualification' | 'requirement_review' | 'stakeholder_mapping' | 'custom';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  opportunity_id?: string;
  account_id?: string;
  assigned_to?: string;
  created_by?: string;
}

export interface ActivityAttachment {
  id: string;
  activity_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  uploaded_by?: string;
  created_at: string;
}

// The Unified Timeline Model sent to the Frontend UI
export interface TimelineEvent {
  event_id: string; // Mapped from original ID (activity, task, or signal)
  event_type: 'activity' | 'task' | 'signal' | 'system';
  icon: string; // e.g., 'phone', 'mail', 'sparkles'
  title: string;
  description: string;
  timestamp: string;
  actor_name: string; // User Name, Contact Name, or System
  metadata: Record<string, any>;
}
