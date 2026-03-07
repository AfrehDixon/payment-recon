// wallet-addresses.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  WalletAddress, 
  WalletAddressSummary,
  WalletAddressFilters,
  WalletAddressListResponse,
  WalletAddressSummaryResponse
} from '../wallet-addresses/wallet-addresses.interface';

@Injectable({
  providedIn: 'root',
})
export class WalletAddressesService {
  private baseUrl = 'https://doronpay.com/api/transactions';

  constructor(private http: HttpClient) {}

  getWalletAddresses(filters?: WalletAddressFilters): Observable<WalletAddressListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    
    return this.http.get<WalletAddressListResponse>(
      `${this.baseUrl}/wallet-addresses`,
      { params }
    );
  }

  getWalletAddress(id: string): Observable<{
    success: boolean;
    data: WalletAddress;
  }> {
    return this.http.get<{
      success: boolean;
      data: WalletAddress;
    }>(`${this.baseUrl}/wallet-addresses/${id}`);
  }

  getWalletSummary(network?: string, asset?: string): Observable<WalletAddressSummaryResponse> {
    let params = new HttpParams();
    if (network) params = params.set('network', network);
    if (asset) params = params.set('asset', asset);
    
    return this.http.get<WalletAddressSummaryResponse>(
      `${this.baseUrl}/wallet-addresses/summary`,
      { params }
    );
  }
}