import { BaseDataConnector } from "./BaseDataConnector";

export abstract class BaseProjectConnector<TRaw = any, TTransformed = any> extends BaseDataConnector<TRaw, TTransformed> {
  constructor(sourceId: string) {
    super(sourceId, 'project');
  }

  // Base methods are inherited from BaseDataConnector:
  // - authenticate()
  // - fetchData()
  // - transform()
  // - uploadBatch()
  // - triggerProcessing()
}
