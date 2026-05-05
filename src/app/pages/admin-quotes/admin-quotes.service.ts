// admin-quotes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Quote,
  QuoteFilters,
  QuoteListResponse,
  ExpireQuotePayload,
  ExpireQuoteResponse
} from './admin-quotes.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminQuotesService {
  private baseUrl = 'https://doronpay.com/api/custody/trading/quotes';

  constructor(private http: HttpClient) {}

  /**
   * List quotes with filters
   */
  listQuotes(filters?: QuoteFilters): Observable<QuoteListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<QuoteListResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get quote by ID
   */
  getQuoteById(quoteId: string): Observable<{ success: boolean; data: Quote }> {
    return this.http.get<{ success: boolean; data: Quote }>(`${this.baseUrl}/${quoteId}`);
  }

  /**
   * Expire a quote
   */
  expireQuote(quoteId: string, payload: ExpireQuotePayload): Observable<ExpireQuoteResponse> {
    return this.http.post<ExpireQuoteResponse>(`${this.baseUrl}/${quoteId}/expire`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<QuoteFilters>): HttpParams {
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