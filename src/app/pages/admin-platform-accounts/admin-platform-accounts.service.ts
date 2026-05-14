// admin-platform-accounts.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PlatformAccount,
  PlatformAccountFilters,
  PlatformAccountListResponse,
  PlatformAccountResponse,
  SeedDefaultsPayload,
  CreatePlatformAccountPayload,
  UpdatePlatformAccountPayload,
  ManualAdjustmentPayload,
  VatRemittancePayload,
  AdjustmentResponse
} from './admin-platform-accounts.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminPlatformAccountsService {
  private baseUrl = 'https://doronpay.com/api/accounts';

  constructor(private http: HttpClient) {}

  /**
   * Seed default platform accounts for a currency
   */
  seedDefaults(payload: SeedDefaultsPayload): Observable<PlatformAccountListResponse> {
    return this.http.post<PlatformAccountListResponse>(`${this.baseUrl}/accounts/platform-accounts/seed-defaults`, payload);
  }

  /**
   * Create platform account manually
   */
  createAccount(payload: CreatePlatformAccountPayload): Observable<PlatformAccountResponse> {
    return this.http.post<PlatformAccountResponse>(`${this.baseUrl}/platform-accounts/create`, payload);
  }

  /**
   * List platform accounts
   */
  listAccounts(filters?: PlatformAccountFilters): Observable<PlatformAccountListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<PlatformAccountListResponse>(`${this.baseUrl}/platform-accounts/list`, { params });
  }

  /**
   * Get platform account by ID
   */
  getAccountById(accountId: string): Observable<PlatformAccountResponse> {
    return this.http.get<PlatformAccountResponse>(`${this.baseUrl}/platform-accounts/${accountId}`);
  }

  /**
   * Update platform account
   */
  updateAccount(accountId: string, payload: UpdatePlatformAccountPayload): Observable<PlatformAccountResponse> {
    return this.http.put<PlatformAccountResponse>(`${this.baseUrl}/platform-accounts/${accountId}`, payload);
  }

  /**
   * Manual adjustment on platform account
   */
  manualAdjustment(payload: ManualAdjustmentPayload): Observable<AdjustmentResponse> {
    return this.http.post<AdjustmentResponse>(`${this.baseUrl}/platform-accounts/manual-adjustment`, payload);
  }

  /**
   * VAT remittance (debit VAT payable account)
   */
  vatRemittance(payload: VatRemittancePayload): Observable<AdjustmentResponse> {
    return this.http.post<AdjustmentResponse>(`${this.baseUrl}/platform-accounts/vat-remittance`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: PlatformAccountFilters): HttpParams {
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