// admin-rate-health.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RateHealthResponse } from './admin-rate-health.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminRateHealthService {
  private baseUrl = 'https://doronpay.com/api/custody/admin/dashboard';

  constructor(private http: HttpClient) {}

  getRateHealth(): Observable<RateHealthResponse> {
    return this.http.get<RateHealthResponse>(`${this.baseUrl}/rate-health`);
  }
}