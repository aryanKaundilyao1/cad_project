import { InternalSignalGenerator, RawEntity, GeneratedSignal } from './InternalSignalGenerator';
import { InternalSignalValidator } from './InternalSignalValidator';

export class InternalSignalExtractor {
  
  static async processLead(leadRecord: any): Promise<GeneratedSignal[]> {
    const entity: RawEntity = {
      id: leadRecord.id,
      type: 'lead',
      data: leadRecord,
      source: leadRecord.source_origin || 'System Generated',
      timestamp: leadRecord.created_at || new Date().toISOString()
    };
    
    return await this.extractAndValidate(entity);
  }

  static async processProject(projectRecord: any): Promise<GeneratedSignal[]> {
    const entity: RawEntity = {
      id: projectRecord.id,
      type: 'project',
      data: projectRecord,
      source: 'Admin Entry',
      timestamp: projectRecord.created_at || new Date().toISOString()
    };
    
    return await this.extractAndValidate(entity);
  }

  static async processCrmActivity(crmRecord: any): Promise<GeneratedSignal[]> {
    const entity: RawEntity = {
      id: crmRecord.id,
      type: 'crm_activity',
      data: crmRecord,
      source: 'User Generated',
      timestamp: crmRecord.created_at || new Date().toISOString()
    };
    
    return await this.extractAndValidate(entity);
  }

  private static async extractAndValidate(entity: RawEntity): Promise<GeneratedSignal[]> {
    // 1. Generation
    const rawSignals = InternalSignalGenerator.generateFromEntity(entity);
    
    // 2. Validation
    const validatedSignals = await InternalSignalValidator.validate(rawSignals);
    
    return validatedSignals;
  }
}
