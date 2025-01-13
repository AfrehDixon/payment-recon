import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransactionResponse } from './transaction.interface';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private baseUrl = 'https://doronpay.com/api';

  constructor(private http: HttpClient) {}

  getTransactionById(id: string): Observable<TransactionResponse> {
    return this.http.get<TransactionResponse>(`${this.baseUrl}/transactions/get/${id}`);
  }
}