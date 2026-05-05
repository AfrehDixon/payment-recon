// admin-trading-summary.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TradingSummaryResponse } from './admin-trading-summary.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminTradingSummaryService {
  private baseUrl = 'https://doronpay.com/api/custody/admin/dashboard';

  constructor(private http: HttpClient) {}

  getTradingSummary(): Observable<TradingSummaryResponse> {
    return this.http.get<TradingSummaryResponse>(`${this.baseUrl}/trading-summary`);
  }
}