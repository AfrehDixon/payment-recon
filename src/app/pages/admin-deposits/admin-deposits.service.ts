// admin-deposits.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Deposit,
  DepositFilters,
  DepositListResponse,
  DepositDetailsResponse,
  ReprocessDepositPayload,
  ReprocessDepositResponse
} from './admin-deposits.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminDepositsService {
  private baseUrl = 'https://doronpay.com/api/custody/deposits';

  constructor(private http: HttpClient) {}

  /**
   * List deposits with filters
   */
  listDeposits(filters?: DepositFilters): Observable<DepositListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<DepositListResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get deposit by ID
   */
  getDepositById(depositEventId: string): Observable<DepositDetailsResponse> {
    return this.http.get<DepositDetailsResponse>(`${this.baseUrl}/${depositEventId}`);
  }

  /**
   * Reprocess a deposit
   */
  reprocessDeposit(depositEventId: string, payload: ReprocessDepositPayload): Observable<ReprocessDepositResponse> {
    return this.http.post<ReprocessDepositResponse>(`${this.baseUrl}/${depositEventId}/reprocess`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<DepositFilters>): HttpParams {
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