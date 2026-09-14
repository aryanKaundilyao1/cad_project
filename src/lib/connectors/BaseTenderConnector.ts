import { BaseDataConnector } from "./BaseDataConnector";

export abstract class BaseTenderConnector<TRaw = any, TTransformed = any> extends BaseDataConnector<TRaw, TTransformed> {
  constructor(sourceId: string) {
    super(sourceId, 'tender');
  }

  // Base methods are inherited from BaseDataConnector:
  // - authenticate()
  // - fetchData()
  // - transform()
  // - uploadBatch()
  // - triggerProcessing()
}
