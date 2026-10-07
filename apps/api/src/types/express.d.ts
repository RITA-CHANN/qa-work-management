declare global {
  namespace Express {
    interface Request {
      /** Set by the requestId middleware. */
      requestId: string;
    }
  }
}

export {};
