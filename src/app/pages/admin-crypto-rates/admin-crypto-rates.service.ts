// admin-crypto-rates.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CryptoRate,
  CryptoRateFilters,
  CryptoRateListResponse,
  RefreshRatesPayload,
  RefreshRateResponse
} from './admin-crypto-rates.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminCryptoRatesService {
  private baseUrl = 'https://doronpay.com/api/custody/trading/rates/crypto';

  constructor(private http: HttpClient) {}

  /**
   * List crypto rates with filters
   */
  listRates(filters?: CryptoRateFilters): Observable<CryptoRateListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<CryptoRateListResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get crypto rate by pair code
   */
  getRateByPairCode(pairCode: string): Observable<{ success: boolean; data: CryptoRate }> {
    return this.http.get<{ success: boolean; data: CryptoRate }>(`${this.baseUrl}/${pairCode}`);
  }

  /**
   * Refresh all crypto rates
   */
  refreshAllRates(payload: RefreshRatesPayload): Observable<RefreshRateResponse> {
    return this.http.post<RefreshRateResponse>(`${this.baseUrl}/refresh`, payload);
  }

  /**
   * Refresh a specific crypto rate by pair code
   */
  refreshRateByPairCode(pairCode: string, payload: RefreshRatesPayload): Observable<RefreshRateResponse> {
    return this.http.post<RefreshRateResponse>(`${this.baseUrl}/${pairCode}/refresh`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<CryptoRateFilters>): HttpParams {
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