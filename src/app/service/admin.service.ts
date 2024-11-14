import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FilterChangedEvent } from 'ag-grid-community';
import { Observable, catchError, of, take, tap } from 'rxjs';
import API from '../constants/api.constant';

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
}
