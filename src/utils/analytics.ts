export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName, parameters);
  } else {
    console.warn(`[Analytics] gtag not found. Event ignored: ${eventName}`, parameters);
  }
};
