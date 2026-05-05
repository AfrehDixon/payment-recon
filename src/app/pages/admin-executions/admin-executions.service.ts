// admin-executions.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Execution,
  ExecutionFilters,
  ExecutionListResponse,
  ReconcileExecutionPayload,
  ReconcileExecutionResponse
} from './admin-executions.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminExecutionsService {
  private baseUrl = 'https://doronpay.com/api/custody/trading/executions';

  constructor(private http: HttpClient) {}

  /**
   * List executions with filters
   */
  listExecutions(filters?: ExecutionFilters): Observable<ExecutionListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<ExecutionListResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get execution by ID
   */
  getExecutionById(executionId: string): Observable<{ success: boolean; data: Execution }> {
    return this.http.get<{ success: boolean; data: Execution }>(`${this.baseUrl}/${executionId}`);
  }

  /**
   * Reconcile an execution
   */
  reconcileExecution(executionId: string, payload: ReconcileExecutionPayload): Observable<ReconcileExecutionResponse> {
    return this.http.post<ReconcileExecutionResponse>(`${this.baseUrl}/${executionId}/reconcile`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<ExecutionFilters>): HttpParams {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    
    return params;
  }
}