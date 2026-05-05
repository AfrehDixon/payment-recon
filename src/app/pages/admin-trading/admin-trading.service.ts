// admin-trading.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TradingPair,
  CreatePairPayload,
  UpdatePairPayload,
  PairFilters,
  PairListResponse,
  PairActionPayload
} from './admin-trading.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminTradingService {
  private baseUrl = 'https://doronpay.com/api/custody/trading';

  constructor(private http: HttpClient) {}

  /**
   * List trading pairs with filters
   */
  listPairs(filters?: PairFilters): Observable<PairListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<PairListResponse>(`${this.baseUrl}/pairs`, { params });
  }

  /**
   * Create a new trading pair
   */
  createPair(payload: CreatePairPayload): Observable<{ success: boolean; data: TradingPair }> {
    return this.http.post<{ success: boolean; data: TradingPair }>(`${this.baseUrl}/pairs`, payload);
  }

  /**
   * Get pair by ID
   */
  getPairById(pairId: string): Observable<{ success: boolean; data: TradingPair }> {
    return this.http.get<{ success: boolean; data: TradingPair }>(`${this.baseUrl}/pairs/${pairId}`);
  }

  /**
   * Update trading pair
   */
  updatePair(pairId: string, payload: UpdatePairPayload): Observable<{ success: boolean; data: TradingPair }> {
    return this.http.put<{ success: boolean; data: TradingPair }>(`${this.baseUrl}/pairs/${pairId}`, payload);
  }

  /**
   * Enable trading pair
   */
  enablePair(pairId: string, payload: PairActionPayload): Observable<{ success: boolean; data: TradingPair }> {
    return this.http.post<{ success: boolean; data: TradingPair }>(`${this.baseUrl}/pairs/${pairId}/enable`, payload);
  }

  /**
   * Disable trading pair
   */
  disablePair(pairId: string, payload: PairActionPayload): Observable<{ success: boolean; data: TradingPair }> {
    return this.http.post<{ success: boolean; data: TradingPair }>(`${this.baseUrl}/pairs/${pairId}/disable`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<PairFilters>): HttpParams {
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