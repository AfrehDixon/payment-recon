import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChargeConfig } from './charge-config.interface';

@Injectable({
  providedIn: 'root'
})
export class ChargeConfigService {
  private baseUrl = 'https://doronpay.com/api';

  constructor(private http: HttpClient) {}

  getChargeConfigs(): Observable<{ success: boolean; data: ChargeConfig[] }> {
    return this.http.get<{ success: boolean; data: ChargeConfig[] }>(
      `${this.baseUrl}/charge-configurations/get`
    );
  }

  getMerchants(): Observable<any> {
    return this.http.get(`${this.baseUrl}/merchants/get`);
  }

  createChargeConfig(config: ChargeConfig): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/charge-configurations/add`,
      config
    );
  }

  updateChargeConfig(id: string, config: ChargeConfig): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/charge-configurations/update/${id}`,
      config
    );
  }
}