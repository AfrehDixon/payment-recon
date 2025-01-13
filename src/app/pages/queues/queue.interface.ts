// src/app/interfaces/queue.interface.ts
export interface QueueItem {
    _id: string;
    transactionId: {
      _id: string;
      transactionRef: string;
      actualAmount: number;
      amount: number;
      transaction_type: string;
      status: string;
      transaction?: any;
    };
    transactionRef: string;
    processorType: string;
    processorStatus: string;
    internalStatus: string;
    processed: boolean;
    processingAttempts: number;
    callbackPayload: any;
    createdAt: string;
    updatedAt: string;
    processingCompleted?: string;
  }
  
  export interface QueueStats {
    count: number;
    failedCount: number;
    processorType?: string;
    internalStatus?: string;
    processed?: boolean;
    avgAttempts: number | null;
    processingTimeAvg: number | null;
  }
  
  export interface PaginatedResponse<T> {
    success: boolean;
    data: {
      items: T[];
      metadata: {
        total: number;
        page: number;
        limit: number;
      }
    }
  }
  
  export interface QueueFilters {
    page?: number;
    limit?: number;
    processed?: boolean | null;
    processorType?: string;
    internalStatus?: string;
    processorStatus?: string;
    transactionRef?: string;
    fromDate?: Date | null;
    toDate?: Date | null;
  }