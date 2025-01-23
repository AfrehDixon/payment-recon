import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, SystemSettings } from './system-settings.interface';

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private baseUrl = 'https://doronpay.com/api/system';

  constructor(private http: HttpClient) {}

  getSystemSettings(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/get`);
  }

  updateSettings(settings: Partial<SystemSettings>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/update`, settings);
  }
}
