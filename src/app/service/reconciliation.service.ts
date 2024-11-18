import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { Transaction, TransactionSummary } from '../types';
import API from '../constants/api.constant';

// Define interfaces for request payloads
interface TransactionFilter {
  startDate: string;
  endDate: string;
  roleId: string;
  status: string;
  transaction_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private readonly apiUrl = `${API}/transactions/role/reports`;
  
  constructor(private http: HttpClient) {}

  roleReports(filter: TransactionFilter): Observable<Transaction[]> {
    return this.http.post<Transaction[]>(this.apiUrl, filter)
      .pipe(
        retry(1), // Retry failed requests once
        map(response => this.transformTransactions(response)),
        catchError(this.handleError)
      );
  }

  getTransactions(filter: TransactionFilter): Observable<Transaction[]> {
    return this.http.post<Transaction[]>(this.apiUrl, filter)
      .pipe(
        retry(1),
        map(response => this.transformTransactions(response)),
        catchError(this.handleError)
      );
  }

  getTransactionSummary(transactions: Transaction[]): TransactionSummary {
    try {
      const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const successful = transactions.filter(t => t.status === 'success').length;
      const count = transactions.length || 1; // Prevent division by zero
      
      return {
        totalAmount: total,
        transactionCount: count,
        successRate: (successful / count) * 100,
        failureRate: ((count - successful) / count) * 100
      };
    } catch (error) {
      console.error('Error calculating transaction summary:', error);
      return {
        totalAmount: 0,
        transactionCount: 0,
        successRate: 0,
        failureRate: 0
      };
    }
  }

  // Helper method to transform API response
  private transformTransactions(response: any): Transaction[] {
    if (!response) return [];

    const transactions = Array.isArray(response) ? response : response.data || [];
    
    return transactions.map((transaction: { id: any; transactionNumber: any; date: string | number | Date; amount: any; bankFee: any; profit: any; status: any; paymentMethod: any; }) => ({
      id: transaction.id || '',
      transactionNumber: transaction.transactionNumber || '',
      date: new Date(transaction.date),
      amount: Number(transaction.amount) || 0,
      bankFee: Number(transaction.bankFee) || 0,
      profit: Number(transaction.profit) || 0,
      status: transaction.status || 'pending',
      paymentMethod: transaction.paymentMethod || 'Unknown'
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

  private mockTransactions: Transaction[] = [
    {
      id: '1817773697',
      transactionNumber: 'Afreh Dixon',
      date: new Date('2023-09-21'),
      amount: 1000.00,
      bankFee: 20.00,
      profit: 980.00,
      status: 'success',
      paymentMethod: 'Credit Card'
    },
    {
      id: '1817773697',
      transactionNumber: 'Afreh Dixon',
      date: new Date('2023-09-21'),
      amount: 1000.00,
      bankFee: 20.00,
      profit: 980.00,
      status: 'success',
      paymentMethod: 'Credit Card'
    },
    {
      id: '1817773697',
      transactionNumber: 'Afreh Dixon',
      date: new Date('2023-09-21'),
      amount: 1000.00,
      bankFee: 20.00,
      profit: 980.00,
      status: 'success',
      paymentMethod: 'Credit Card'
    },
    {
      id: '1817773697',
      transactionNumber: 'Afreh Dixon',
      date: new Date('2023-09-21'),
      amount: 1000.00,
      bankFee: 20.00,
      profit: 980.00,
      status: 'cancelled',
      paymentMethod: 'Credit Card'
    },
    {
      id: '1817773697',
      transactionNumber: 'Afreh Dixon',
      date: new Date('2023-09-21'),
      amount: 1000.00,
      bankFee: 20.00,
      profit: 980.00,
      status: 'cancelled',
      paymentMethod: 'Credit Card'
    },
    {
      id: '1817773697',
      transactionNumber: 'Afreh Dixon',
      date: new Date('2023-09-21'),
      amount: 1000.00,
      bankFee: 20.00,
      profit: 980.00,
      status: 'cancelled',
      paymentMethod: 'Credit Card'
    },
    // Add more mock transactions here
  ];
}