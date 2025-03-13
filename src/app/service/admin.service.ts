import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FilterChangedEvent } from 'ag-grid-community';
import { Observable, catchError, of, take, tap } from 'rxjs';
import API from '../constants/api.constant';
import { ETierLevel, ETierScope } from '../pages/merchant-tier/merchant-tier.interface';

export interface Admin {
  _id?: string;
  email: string;
  password?: string;
  phone?: string;
  permissions?: string[];
  name: string;
  role: 'super' | 'normal';
  blocked: boolean;
  account_type: 'admin' | 'merchant';
  merchantId?: string;
  lastSeen?: Date;
  createdAt?: Date;
}
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${API}/merchants/login`, data).pipe(
      take(1),
      catchError((err) => of(err)),
      tap((res) => {
        if (!res.success) {
          throw Error(res.message);
        }
      })
    );
  }
  signup(data: any): Observable<any> {
    return this.http.post(`${API}/merchants/register`, data);
  }

  // otp():Promise<any>{
  //     return this.http.post(`${API}/transactions/reversal/otp`)
  //             .toPromise();
  // }

  requestOtp(): Promise<any> {
    return fetch(`${API}/otp/sendotp`, {
      method: 'POST',
      headers: {
        'Content-type': 'Application/json',
      },
    }).then((res) => res.json());
  }

  sendotp(data: any): Observable<any> {
    return this.http.post(`${API}/otp/sendotp`, data).pipe(
      take(1),
      catchError((err) => of(err)),
      tap((res) => {
        if (!res.success) {
          throw Error(res.message);
        }
      })
    );
  }

  validate(data: any): Observable<any> {
    return this.http.post(`${API}/otp/validate`, data).pipe(
      take(1),
      catchError((err) => of(err)),
      tap((res) => {
        if (!res.success) {
          throw Error(res.message);
        }
      })
    );
  }

    getAdmins(): Observable<any> {
    return this.http.get<any[]>(`${API}/admin/get`).pipe(
      take(1),
      catchError((err) => of(err)),
      tap((res) => {
        if (!res.success) {
          throw Error(res.message);
        }
      })
    );
  }

  addAdmin(data: any): Observable<any> {
    return this.http.post(`${API}/admin/add`, data).pipe(
      take(1),
      catchError((err) => of(err)),
      tap((res) => {
        if (!res.success) {
          throw Error(res.message);
        }
      })
    );
  }

  updateAdmin(data: { id: string; data: any }): Observable<any> {
    return this.http.put(`${API}/admin/update`, data).pipe(
      take(1),
      catchError((err) => of(err)),
      tap((res) => {
        if (!res.success) {
          throw Error(res.message);
        }
      })
    );
  }

  deleteAdmin(id: string): Observable<any> {
    return this.http.delete(`${API}/admin/delete/${id}`).pipe(
      take(1),
      catchError((err) => of(err)),
      tap((res) => {
        if (!res.success) {
          throw Error(res.message);
        }
      })
    );
  }

  filterAdmins(filters: any): Observable<any> {
    return this.http.post(`${API}/admin/filter`, filters).pipe(
      take(1),
      catchError((err) => of(err)),
      tap((res) => {
        if (!res.success) {
          throw Error(res.message);
        }
      })
    );
  }

  getMerchants(): Observable<{ success: boolean, message: string, data: any[] }> {
    return this.http.get<{ success: boolean, message: string, data: any[] }>(`${API}/merchants/get`);
  }

  // Get merchant tiers with optional filtering
  getMerchantTiers(filters?: {
    merchantId?: string;
    scope?: ETierScope;
    level?: ETierLevel;
    feature?: string;
  }): Observable<any[]> {
    return this.http.get<any[]>(`${API}/merchants/merchant-tiers`, { params: filters as any });
  }

  // Create a new tier
  createTier(merchantId: string, tierData: any): Observable<any> {
    return this.http.post(`${API}/merchants/merchant-tiers`, {
      merchantId,
      tierData
    });
  }

  // Update existing tier
  updateTier(tierId: string, tierData: any): Observable<any> {
    return this.http.put(`${API}/merchants/merchant-tiers/${tierId}`, tierData);
  }

  // Assign tier to merchant
  assignTierToMerchant(merchantId: string, tierData: { 
    feature?: string; 
    preferredLevel?: ETierLevel;
  }): Observable<any> {
    return this.http.post(`${API}/merchants/merchant-tiers/select`, {
      merchantId,
      ...tierData
    });
  }

  // Helper method to convert tier level to readable name
  getTierLevelName(level: ETierLevel): string {
    switch(level) {
      case ETierLevel.BASIC: return 'Basic';
      case ETierLevel.STANDARD: return 'Standard';
      case ETierLevel.PREMIUM: return 'Premium';
      case ETierLevel.ENTERPRISE: return 'Enterprise';
      default: return 'Unknown';
    }
  }

  // Helper to format scope
  formatScope(scope: ETierScope): string {
    return scope === ETierScope.GLOBAL ? 'Global' : 'Merchant Specific';
  }
}
