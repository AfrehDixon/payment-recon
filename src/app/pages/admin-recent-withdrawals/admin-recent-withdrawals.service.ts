// admin-recent-withdrawals.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecentWithdrawalsResponse } from './admin-recent-withdrawals.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminRecentWithdrawalsService {
  private baseUrl = 'https://doronpay.com/api/custody/admin/dashboard';

  constructor(private http: HttpClient) {}

  getRecentWithdrawals(): Observable<RecentWithdrawalsResponse> {
    return this.http.get<RecentWithdrawalsResponse>(`${this.baseUrl}/recent-withdrawals`);
  }
}