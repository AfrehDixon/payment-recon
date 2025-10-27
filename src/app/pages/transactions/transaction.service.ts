import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
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

interface RetryConsolidationRequest {
  id: string;
  force?: boolean;
}

interface ConsolidationResponse {
  success: boolean;
  status?: string;
  operator?: string;
  txid?: string;
  message?: string;
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

 retryConsolidation(data: RetryConsolidationRequest): Observable<ConsolidationResponse> {
    return this.http.post<ConsolidationResponse>(
      `${this.baseUrl}/transactions/consolidations/${data.id}/retry`,
      { force: data.force || false }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        // If the error has a response body with our expected structure, return it
        if (error.error && typeof error.error === 'object') {
          return throwError(() => error.error);
        }
        // Otherwise, create a generic error response
        return throwError(() => ({
          success: false,
          message: error.message || 'An unexpected error occurred'
        }));
      })
    );
  }
}