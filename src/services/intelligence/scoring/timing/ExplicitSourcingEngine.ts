export class ExplicitSourcingEngine {
  /**
   * HasExplicitSourcingAction
   * Max 10 points. 
   * Simple presence check for RFP, RFQ, or Tender.
   */
  static evaluate(rfpPresent: boolean, rfqPresent: boolean, tenderPresent: boolean): number {
    if (rfpPresent || rfqPresent || tenderPresent) {
      return 10;
    }
    return 0;
  }
}
