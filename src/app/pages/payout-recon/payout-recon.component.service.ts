// payout-recon.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import url from '../../constants/api.constant';

@Injectable({
  providedIn: 'root'
})
export class PayoutReconciliationService {
  private apiUrl = url; 

  constructor(private http: HttpClient) {}

  getReconSummary(): Observable<{ success: boolean, data: any[] }> {
    return this.http.get<{ success: boolean, data: any[] }>(`${this.apiUrl}/payout-recon/summary`);
  }

  getMerchants(): Observable<{ success: boolean, message: string, data: any[] }> {
    return this.http.get<{ success: boolean, message: string, data: any[] }>(`${this.apiUrl}/merchants/get`);
  }

  runManualReconciliation(data: {
    startDate: string;
    endDate: string;
    merchantId?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/payout-recon/run`, data);
  }

  getMerchantMetrics(merchantId: string, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/merchants/${merchantId}?limit=${limit}`);
  }

  getIssuesList(params: {
    merchantId?: string;
    issueType?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    // Convert params to query string
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) queryParams.set(key, value.toString());
    }
    
    return this.http.get(`${this.apiUrl}/payout-recon/issues?${queryParams}`);
  }
}