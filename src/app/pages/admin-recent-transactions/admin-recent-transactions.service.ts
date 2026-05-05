// admin-recent-transactions.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecentTransactionsResponse } from './admin-recent-transactions.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminRecentTransactionsService {
  private baseUrl = 'https://doronpay.com/api/custody/admin/dashboard';

  constructor(private http: HttpClient) {}

  getRecentTransactions(limit: number = 20): Observable<RecentTransactionsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    return this.http.get<RecentTransactionsResponse>(`${this.baseUrl}/recent-transactions`, { params });
  }
}