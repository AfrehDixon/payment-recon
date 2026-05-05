// admin-liquidity-summary.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LiquiditySummaryResponse } from './admin-liquidity-summary.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminLiquiditySummaryService {
  private baseUrl = 'https://doronpay.com/api/custody/admin/dashboard';

  constructor(private http: HttpClient) {}

  getLiquiditySummary(): Observable<LiquiditySummaryResponse> {
    return this.http.get<LiquiditySummaryResponse>(`${this.baseUrl}/liquidity-summary`);
  }
}