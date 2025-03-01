import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransactionResponse } from './transaction.interface';
interface TransactionUpdateRequest {
  id: string;
  data: {
    status: string;
  };
}

interface ReverseRequest {
  transactionRef: string;
  amount: number;
  description: string;
}

interface CompleteRequest {
  id: string;
  status: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private baseUrl = 'https://doronpay.com/api';

  constructor(private http: HttpClient) {}

  getTransactionById(id: string): Observable<TransactionResponse> {
    return this.http.get<TransactionResponse>(`${this.baseUrl}/transactions/get/${id}`);
  }

  updateTransaction(data: TransactionUpdateRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/transactions/update`, data);
  }
  
  reverseTransaction(data: ReverseRequest): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/transactions/reverse`, data);
  }
  
  completeTransaction(data: CompleteRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/transactions/complete`, data);
  }
}