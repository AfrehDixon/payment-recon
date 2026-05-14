import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTreasuryQuotePayload,
  RequestExternalQuotePayload,
  TreasuryQuoteResponse,
  ExternalQuoteResponse,
  GetTreasuryQuoteResponse,
  ListTreasuryQuotesParams,
  ListTreasuryQuotesResponse
} from './admin-treasury-quotes.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminTreasuryQuotesService {
  private baseUrl = 'https://doronpay.com/api/treasury';

  constructor(private http: HttpClient) {}

  /**
   * List treasury quotes with filters
   */
  listQuotes(params: ListTreasuryQuotesParams): Observable<ListTreasuryQuotesResponse> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof ListTreasuryQuotesParams];
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    
    return this.http.get<ListTreasuryQuotesResponse>(`${this.baseUrl}/admin/quotes`, { params: httpParams });
  }

  /**
   * Create treasury quote
   */
  createQuote(payload: CreateTreasuryQuotePayload): Observable<TreasuryQuoteResponse> {
    return this.http.post<TreasuryQuoteResponse>(`${this.baseUrl}/quotes`, payload);
  }

  /**
   * Get treasury quote by reference
   */
  getQuoteByRef(quoteRef: string): Observable<GetTreasuryQuoteResponse> {
    return this.http.get<GetTreasuryQuoteResponse>(`${this.baseUrl}/quotes/${quoteRef}`);
  }

  /**
   * Request external treasury quote from bank provider
   */
  requestExternalQuote(payload: RequestExternalQuotePayload): Observable<ExternalQuoteResponse> {
    return this.http.post<ExternalQuoteResponse>(`${this.baseUrl}/admin/quotes/external`, payload);
  }
}