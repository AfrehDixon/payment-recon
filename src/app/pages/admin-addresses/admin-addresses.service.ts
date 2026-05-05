// admin-addresses.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CustodyAddress,
  AddressFilters,
  AddressListResponse,
  AddressDetailsResponse,
  AddressActionPayload,
  AddressActionResponse
} from './admin-addresses.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminAddressesService {
  private baseUrl = 'https://doronpay.com/api/custody/addresses';

  constructor(private http: HttpClient) {}

  /**
   * List addresses with filters
   */
  listAddresses(filters?: AddressFilters): Observable<AddressListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<AddressListResponse>(`${this.baseUrl}`, { params });
  }

  /**
   * Get address by ID
   */
  getAddressById(addressId: string): Observable<AddressDetailsResponse> {
    return this.http.get<AddressDetailsResponse>(`${this.baseUrl}/${addressId}`);
  }

  /**
   * Retire an address
   */
  retireAddress(addressId: string, payload: AddressActionPayload): Observable<AddressActionResponse> {
    return this.http.post<AddressActionResponse>(`${this.baseUrl}/${addressId}/retire`, payload);
  }

  /**
   * Unretire an address
   */
  unretireAddress(addressId: string, payload: AddressActionPayload): Observable<AddressActionResponse> {
    return this.http.post<AddressActionResponse>(`${this.baseUrl}/${addressId}/unretire`, payload);
  }

  /**
   * Lock an address
   */
  lockAddress(addressId: string, payload: AddressActionPayload): Observable<AddressActionResponse> {
    return this.http.post<AddressActionResponse>(`${this.baseUrl}/${addressId}/lock`, payload);
  }

  /**
   * Unlock an address
   */
  unlockAddress(addressId: string, payload: AddressActionPayload): Observable<AddressActionResponse> {
    return this.http.post<AddressActionResponse>(`${this.baseUrl}/${addressId}/unlock`, payload);
  }

  /**
   * Force sweep an address
   */
  forceSweepAddress(addressId: string, payload: AddressActionPayload): Observable<AddressActionResponse> {
    return this.http.post<AddressActionResponse>(`${this.baseUrl}/${addressId}/force-sweep`, payload);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: Partial<AddressFilters>): HttpParams {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    
    return params;
  }
}