export class RetryEngine {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        
        if (attempt >= maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + (Math.random() * 500);
        console.warn(`Operation failed. Retrying attempt ${attempt} in ${Math.round(delay)}ms. Error: ${error.message}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('RetryEngine exceeded max retries without throwing or returning.');
  }
}
