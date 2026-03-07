// account-ledger.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  LedgerFilters,
  LedgerListResponse,
  LedgerSummaryResponse,
  AccountLedgerEntry
} from './account-ledger.interface';

@Injectable({
  providedIn: 'root',
})
export class AccountLedgerService {
  private baseUrl = 'https://doronpay.com/api/accounts';

  constructor(private http: HttpClient) {}

  /**
   * Get ledger entries across all accounts (admin)
   */
  getLedgerEntries(filters?: LedgerFilters): Observable<LedgerListResponse> {
    let params = this.buildParams(filters);
    console.log('Fetching ledger entries with params:', params.toString());
    return this.http.get<LedgerListResponse>(`${this.baseUrl}/ledger`, { params });
  }

  /**
   * Get ledger summary across all accounts (admin)
   */
  getLedgerSummary(filters?: Partial<LedgerFilters>): Observable<LedgerSummaryResponse> {
    // Only include parameters that the summary endpoint accepts
    const validParams = ['accountId', 'customerId', 'walletId', 'balanceType', 
                         'direction', 'entryType', 'currency', 'provider', 
                         'operator', 'from', 'to'];
    
    let params = this.buildParams(filters, validParams);
    console.log('Fetching ledger summary with params:', params.toString());
    return this.http.get<LedgerSummaryResponse>(`${this.baseUrl}/ledger/summary`, { params });
  }

  /**
   * Get ledger entries for a specific account
   */
  getAccountLedgerEntries(accountId: string, filters?: LedgerFilters): Observable<LedgerListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<LedgerListResponse>(`${this.baseUrl}/${accountId}/ledger`, { params });
  }

  /**
   * Get ledger summary for a specific account
   */
  getAccountLedgerSummary(accountId: string, filters?: Partial<LedgerFilters>): Observable<LedgerSummaryResponse> {
    // For account-specific summary, the endpoint only accepts: from, to, balanceType
    const validParams = ['from', 'to', 'balanceType'];
    
    let params = this.buildParams(filters, validParams);
    return this.http.get<LedgerSummaryResponse>(`${this.baseUrl}/${accountId}/ledger/summary`, { params });
  }

  /**
   * Get a single ledger entry by ID
   */
  getLedgerEntry(entryId: string): Observable<{ success: boolean; data: AccountLedgerEntry }> {
    return this.http.get<{ success: boolean; data: AccountLedgerEntry }>(
      `${this.baseUrl}/ledger/${entryId}`
    );
  }

  /**
   * Build HTTP params from filters, optionally filtering to only allowed params
   */
  private buildParams(filters?: Partial<LedgerFilters>, allowedParams?: string[]): HttpParams {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        // Skip if value is empty
        if (value === undefined || value === null || value === '') {
          return;
        }
        
        // Skip if not in allowed params list
        if (allowedParams && !allowedParams.includes(key)) {
          return;
        }
        
        // Handle date values
        if (key === 'from' || key === 'to') {
          // Convert string to Date if it's a string, then to ISO
          if (typeof value === 'string') {
            // If it's a datetime-local input value, convert to ISO
            if (value.includes('T')) {
              params = params.set(key, new Date(value).toISOString());
            } else {
              params = params.set(key, value);
            }
          } else {
            // Handle as string
            params = params.set(key, String(value));
          }
        } else {
          params = params.set(key, String(value));
        }
      });
    }
    
    return params;
  }
}