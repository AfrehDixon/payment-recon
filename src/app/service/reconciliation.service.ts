// reconciliation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Transaction, TransactionSummary } from '../types';
import { Store } from '@ngxs/store';
import API  from '../constants/api.constant';


@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private apiUrl = 'https://lazypaygh.com/api/transactions/role/reports';
  // http: any;
  // constructor(private http: HttpClient,) { }
  

  // constructor(private transactionService: ReconciliationService) { }
  
  constructor(private http: HttpClient) { }
  

   roleReports(data: any): Observable<any> {
    return this.http.post(`${API}/transactions/role/reports`, data);
  }
  
  getTransactionss(): Observable<Transaction[]> {
    return this.http.post<Transaction[]>(this.apiUrl, {
  "endDate": "2024-11-13",
  "roleId": "63de11f56e0e069e7b633465",
  "startDate": "2024-11-12",
  "status": "PAID",
  "transaction_type": "DEBIT"
});
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

  

  getTransactions(): Observable<Transaction[]> {
    return of(this.mockTransactions); // Return mock data as Observable
  }

  getTransactionSummary(transactions: Transaction[]): TransactionSummary{
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const successful = transactions.filter(t => t.status === 'success').length;
    
    return {
      totalAmount: total,
      transactionCount: transactions.length,
      successRate: (successful / transactions.length) * 100,
      failureRate: ((transactions.length - successful) / transactions.length) * 100
    };
  }
}