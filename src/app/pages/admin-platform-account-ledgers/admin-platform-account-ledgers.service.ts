// admin-platform-account-ledgers.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PlatformAccountLedger,
  PlatformAccountLedgerFilters,
  PlatformAccountLedgerListResponse,
  PlatformAccountLedgerResponse
} from './admin-platform-account-ledgers.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminPlatformAccountLedgersService {
  private baseUrl = 'https://doronpay.com/api/accounts';

  constructor(private http: HttpClient) {}

  /**
   * List platform account ledger entries
   */
  listLedgers(filters?: PlatformAccountLedgerFilters): Observable<PlatformAccountLedgerListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<PlatformAccountLedgerListResponse>(`${this.baseUrl}/platform-account-ledgers/list`, { params });
  }

  /**
   * Get platform account ledger entry by ID
   */
  getLedgerById(ledgerId: string): Observable<PlatformAccountLedgerResponse> {
    return this.http.get<PlatformAccountLedgerResponse>(`${this.baseUrl}/platform-account-ledgers/${ledgerId}`);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: PlatformAccountLedgerFilters): HttpParams {
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