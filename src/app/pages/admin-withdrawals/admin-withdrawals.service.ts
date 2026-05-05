// admin-withdrawals.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Withdrawal,
  WithdrawalFilters,
  WithdrawalListResponse,
  WithdrawalDetailsResponse,
  WithdrawalActionPayload,
  WithdrawalActionResponse
} from './admin-withdrawals.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminWithdrawalsService {
  private baseUrl = 'https://doronpay.com/api/custody/withdrawals';

  constructor(private http: HttpClient) {}

  listWithdrawals(filters?: WithdrawalFilters): Observable<WithdrawalListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<WithdrawalListResponse>(`${this.baseUrl}`, { params });
  }

  getWithdrawalById(withdrawalId: string): Observable<WithdrawalDetailsResponse> {
    return this.http.get<WithdrawalDetailsResponse>(`${this.baseUrl}/${withdrawalId}`);
  }

  retryWithdrawal(withdrawalId: string, payload: WithdrawalActionPayload): Observable<WithdrawalActionResponse> {
    return this.http.post<WithdrawalActionResponse>(`${this.baseUrl}/${withdrawalId}/retry`, payload);
  }

  cancelWithdrawal(withdrawalId: string, payload: WithdrawalActionPayload): Observable<WithdrawalActionResponse> {
    return this.http.post<WithdrawalActionResponse>(`${this.baseUrl}/${withdrawalId}/cancel`, payload);
  }

  markWithdrawalProcessing(withdrawalId: string, payload: WithdrawalActionPayload): Observable<WithdrawalActionResponse> {
    return this.http.post<WithdrawalActionResponse>(`${this.baseUrl}/${withdrawalId}/mark-processing`, payload);
  }

  markWithdrawalSent(withdrawalId: string, payload: WithdrawalActionPayload): Observable<WithdrawalActionResponse> {
    return this.http.post<WithdrawalActionResponse>(`${this.baseUrl}/${withdrawalId}/mark-sent`, payload);
  }

  markWithdrawalFailed(withdrawalId: string, payload: WithdrawalActionPayload): Observable<WithdrawalActionResponse> {
    return this.http.post<WithdrawalActionResponse>(`${this.baseUrl}/${withdrawalId}/mark-failed`, payload);
  }

  private buildParams(filters?: Partial<WithdrawalFilters>): HttpParams {
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