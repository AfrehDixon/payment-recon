// admin-crypto-remittances.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CryptoRemittance,
  CryptoRemittanceFilters,
  CryptoRemittanceListResponse,
  CryptoRemittanceSummaryResponse,
  CryptoRemittanceDetailsResponse
} from './admin-crypto-remittances.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminCryptoRemittancesService {
  private baseUrl = 'https://doronpay.com/api/crypto-remittance/admin';

  constructor(private http: HttpClient) {}

  /**
   * List crypto remittances with filters
   */
  listRemittances(filters?: CryptoRemittanceFilters): Observable<CryptoRemittanceListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<CryptoRemittanceListResponse>(`${this.baseUrl}/crypto-remittances`, { params });
  }

  /**
   * Get crypto remittance summary
   */
  getRemittanceSummary(filters?: Partial<CryptoRemittanceFilters>): Observable<CryptoRemittanceSummaryResponse> {
    let params = this.buildParams(filters);
    return this.http.get<CryptoRemittanceSummaryResponse>(`${this.baseUrl}/crypto-remittances/summary`, { params });
  }

  /**
   * Get crypto remittance by ID
   */
  getRemittanceById(remittanceId: string): Observable<CryptoRemittanceDetailsResponse> {
    return this.http.get<CryptoRemittanceDetailsResponse>(`${this.baseUrl}/crypto-remittances/${remittanceId}`);
  }

  /**
   * Get crypto remittance by external reference
   */
  getRemittanceByExternalReference(externalReference: string): Observable<CryptoRemittanceDetailsResponse> {
    return this.http.get<CryptoRemittanceDetailsResponse>(`${this.baseUrl}/crypto-remittances/by-external-reference/${externalReference}`);
  }

  /**
   * Get crypto remittance by collection transaction
   */
  getRemittanceByCollectionTransaction(transactionRef: string): Observable<CryptoRemittanceDetailsResponse> {
    return this.http.get<CryptoRemittanceDetailsResponse>(`${this.baseUrl}/crypto-remittances/by-collection-transaction/${transactionRef}`);
  }

  /**
   * Get crypto remittance by payout transaction
   */
  getRemittanceByPayoutTransaction(transactionRef: string): Observable<CryptoRemittanceDetailsResponse> {
    return this.http.get<CryptoRemittanceDetailsResponse>(`${this.baseUrl}/crypto-remittances/by-payout-transaction/${transactionRef}`);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<CryptoRemittanceFilters>): HttpParams {
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