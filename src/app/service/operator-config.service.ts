// services/operator-config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OperatorConfig } from '../pages/operator-config/operator-config.interface';

@Injectable({
  providedIn: 'root'
})
export class OperatorConfigService {
  private baseUrl = 'https://doronpay.com/api';

  constructor(private http: HttpClient) {}

  getOperatorConfigs(): Observable<{ success: boolean; data: OperatorConfig[] }> {
    return this.http.get<{ success: boolean; data: OperatorConfig[] }>(
      `${this.baseUrl}/operator-configurations/get`
    );
  }

  getMerchants(): Observable<any> {
    return this.http.get(`${this.baseUrl}/merchants/get`);
  }

  createOperatorConfig(config: OperatorConfig): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/operator-configurations/add`,
      config
    );
  }

  updateOperatorConfig(id: string, config: OperatorConfig): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/operator-configurations/update/${id}`,
      config
    );
  }
}