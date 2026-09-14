import { DataConnector, FetchDataParams, RecordType } from "./types";
import { ConnectorJobManager } from "./ConnectorJobManager";
import { BatchUploadEngine } from "./BatchUploadEngine";
import { RetryEngine } from "./RetryEngine";

export abstract class BaseDataConnector<TRaw = any, TTransformed = any> implements DataConnector<TRaw, TTransformed> {
  sourceId: string;
  recordType: RecordType;
  
  constructor(sourceId: string, recordType: RecordType) {
    this.sourceId = sourceId;
    this.recordType = recordType;
  }

  // Must be implemented by specific connectors (Google Maps, GeM, etc.)
  abstract authenticate(): Promise<boolean>;
  abstract fetchData(params: FetchDataParams): Promise<{ data: TRaw[], nextCursor?: string }>;
  abstract transform(rawData: TRaw): TTransformed;

  async uploadBatch(data: TTransformed[]): Promise<string> {
    const jobId = await ConnectorJobManager.createJob(this.sourceId);
    await ConnectorJobManager.updateStatus(jobId, 'running');
    
    try {
      await BatchUploadEngine.uploadBatch(jobId, this.recordType, data);
      await ConnectorJobManager.updateStatus(jobId, 'running', data.length);
      return jobId;
    } catch (error: any) {
      await this.handleError(jobId, error);
      throw error;
    }
  }

  async triggerProcessing(jobId: string, adminId: string): Promise<void> {
    try {
      await ConnectorJobManager.triggerProcessing(jobId, this.recordType, adminId);
    } catch (error: any) {
      await this.handleError(jobId, error);
    }
  }

  async handleError(jobId: string, error: Error): Promise<void> {
    console.error(`Connector Error for Job ${jobId}:`, error);
    await ConnectorJobManager.updateStatus(jobId, 'failed');
    await ConnectorJobManager.logError(jobId, `Connector Failure: ${error.message}`);
  }
}
