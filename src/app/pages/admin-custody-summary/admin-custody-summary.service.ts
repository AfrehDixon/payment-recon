// admin-custody-summary.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustodySummaryResponse } from './admin-custody-summary.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminCustodySummaryService {
  private baseUrl = 'https://doronpay.com/api/custody/admin/dashboard';

  constructor(private http: HttpClient) {}

  /**
   * Get custody summary
   */
  getCustodySummary(): Observable<CustodySummaryResponse> {
    return this.http.get<CustodySummaryResponse>(`${this.baseUrl}/custody-summary`);
  }
}