export class PortfolioStreamingEngine {
  /**
   * Handles the Server-Sent Events (SSE) to the frontend, incorporating 
   * the ResponseValidator in the stream pipeline to prevent hallucinations.
   */
  static stream(chunks: string[], contextPackage: any, validatorFn: (chunk: string, pkg: any) => boolean) {
    for (const chunk of chunks) {
      if (!validatorFn(chunk, contextPackage)) {
        throw new Error("STREAM ABORTED: Hallucination detected in chunk");
      }
      // Send chunk to client (SSE)
      console.log("Streaming chunk:", chunk);
    }
  }
}
