// credit-queue.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreditQueueItem,
  CreditQueueFilters,
  CreditQueueListResponse,
  CreditQueueStatsResponse,
  CreditQueueItemResponse,
  QueueActionResponse,
  QueueActionPayload
} from './credit-queue.interface';

@Injectable({
  providedIn: 'root',
})
export class CreditQueueService {
  private baseUrl = 'https://doronpay.com/api/queue/admin/credit-queue';

  constructor(private http: HttpClient) {}

  /**
   * List credit queue items with filters
   */
  getQueueItems(filters?: CreditQueueFilters): Observable<CreditQueueListResponse> {
    let params = this.buildParams(filters);
    console.log('Fetching credit queue items with params:', params.toString());
    return this.http.get<CreditQueueListResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get credit queue statistics
   */
  getQueueStats(): Observable<CreditQueueStatsResponse> {
    console.log('Fetching credit queue stats');
    return this.http.get<CreditQueueStatsResponse>(`${this.baseUrl}/stats`);
  }

  /**
   * Get a single queue item by ID
   */
  getQueueItem(id: string): Observable<CreditQueueItemResponse> {
    return this.http.get<CreditQueueItemResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Retry a failed or cancelled queue item
   */
  retryQueueItem(id: string, payload?: QueueActionPayload): Observable<QueueActionResponse> {
    return this.http.post<QueueActionResponse>(`${this.baseUrl}/${id}/retry`, payload || {});
  }

  /**
   * Cancel a queue item
   */
  cancelQueueItem(id: string, payload?: QueueActionPayload): Observable<QueueActionResponse> {
    return this.http.post<QueueActionResponse>(`${this.baseUrl}/${id}/cancel`, payload || {});
  }

  /**
   * Requeue a queue item (force move back to pending)
   */
  requeueQueueItem(id: string, payload?: QueueActionPayload): Observable<QueueActionResponse> {
    return this.http.post<QueueActionResponse>(`${this.baseUrl}/${id}/requeue`, payload || {});
  }

  /**
   * Release a stuck queue lock
   */
  releaseLock(id: string): Observable<QueueActionResponse> {
    return this.http.post<QueueActionResponse>(`${this.baseUrl}/${id}/release-lock`, {});
  }

  /**
   * Force mark queue item as completed
   */
  markCompleted(id: string, payload: QueueActionPayload): Observable<QueueActionResponse> {
    return this.http.post<QueueActionResponse>(`${this.baseUrl}/${id}/mark-completed`, payload);
  }

  /**
   * Force mark queue item as failed
   */
  markFailed(id: string, payload: QueueActionPayload): Observable<QueueActionResponse> {
    return this.http.post<QueueActionResponse>(`${this.baseUrl}/${id}/mark-failed`, payload);
  }

  /**
   * Build HTTP params from filters - ONLY includes fields the backend accepts
   */
  private buildParams(filters?: Partial<CreditQueueFilters>): HttpParams {
    let params = new HttpParams();
    
    if (filters) {
      // Only include fields that are in the backend validation schema
      const allowedParams = ['page', 'limit', 'status', 'operator', 'merchantId', 
                              'transactionRef', 'externalTransactionId', 'lockedOnly'];
      
      Object.entries(filters).forEach(([key, value]) => {
        // Skip if value is empty
        if (value === undefined || value === null || value === '') {
          return;
        }
        
        // Only include allowed params
        if (!allowedParams.includes(key)) {
          return;
        }
        
        // Handle boolean values (lockedOnly)
        if (key === 'lockedOnly') {
          params = params.set(key, String(value));
        } else {
          params = params.set(key, String(value));
        }
      });
    }
    
    return params;
  }
}