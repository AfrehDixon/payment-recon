import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { Transaction ,  TransactionSummary  ,ApiTransaction} from '../types';
import API from '../constants/api.constant';


// Define interfaces for request payloads
interface TransactionFilter {
  startDate: string;
  endDate: string;
  merchantId: string;
  status: string;
  transaction_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private readonly apiUrl = `${API}/transactions/reports`;
  
  constructor(private http: HttpClient) {}

  getTransactions(filter: TransactionFilter): Observable<ApiTransaction[]> {
    return this.http.post<any>(this.apiUrl, filter).pipe(
      map(response => this.transformTransactions(response))
    );
  }

  private transformTransactions(response: any): ApiTransaction[] {
    if (!response?.data?.transactions) {
      return [];
    }

    return response.data.transactions.map((transaction: any) => ({
      _id: transaction._id,
      actualAmount: Number(transaction.actualAmount),
      amount: Number(transaction.amount),
      charges: Number(transaction.charges),
      createdAt: transaction.createdAt,
      currency: transaction.currency,
      payment_account_issuer: transaction.payment_account_issuer,
      payment_account_name: transaction.payment_account_name,
      payment_account_number: transaction.payment_account_number,
      payment_account_type: transaction.payment_account_type,
      profitEarned: Number(transaction.profitEarned),
      status: transaction.status,
      transactionRef: transaction.transactionRef,
      externalTransactionId: transaction.externalTransactionId,
      transaction_type: transaction.transaction_type,
      customerType: transaction.customerType
    }));
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Forbidden. You don\'t have permission to access this resource.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    console.error('ReconciliationService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

 
}