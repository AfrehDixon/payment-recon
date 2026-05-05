// admin-recent-trades.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecentTradesResponse } from './admin-recent-trades.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminRecentTradesService {
  private baseUrl = 'https://doronpay.com/api/custody/admin/dashboard';

  constructor(private http: HttpClient) {}

  getRecentTrades(): Observable<RecentTradesResponse> {
    return this.http.get<RecentTradesResponse>(`${this.baseUrl}/recent-trades`);
  }
}