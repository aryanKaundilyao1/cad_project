export type RecordType = 'lead' | 'project' | 'tender';

export interface ConnectorConfiguration {
  api_key?: string;
  endpoint?: string;
  max_retries?: number;
  batch_size?: number;
  [key: string]: any;
}

export interface FetchDataParams {
  limit?: number;
  offset?: number;
  cursor?: string;
  [key: string]: any;
}

export interface DataConnector<TRaw = any, TTransformed = any> {
  sourceId: string;
  recordType: RecordType;
  
  authenticate(): Promise<boolean>;
  fetchData(params: FetchDataParams): Promise<{ data: TRaw[], nextCursor?: string }>;
  transform(rawData: TRaw): TTransformed;
  uploadBatch(data: TTransformed[]): Promise<string>; // Returns Job ID
  triggerProcessing(jobId: string, adminId: string): Promise<void>;
  handleError(jobId: string, error: Error): Promise<void>;
}
