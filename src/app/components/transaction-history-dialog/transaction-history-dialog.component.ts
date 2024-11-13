// transaction-history-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Transaction,} from '../../types';

@Component({
  selector: 'app-transaction-history-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="p-6">
      <h2 class="text-lg font-semibold mb-4">Transaction History</h2>
      <div class="mb-4">
        <div class="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded">
          <div>
            <p class="text-sm text-gray-500">Transaction ID</p>
            <p class="font-medium">{{transaction.id}}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Amount</p>
            <p class="font-medium">₹{{transaction.amount | number:'1.2-2'}}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Status</p>
            <p class="font-medium">{{transaction.status}}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Payment Method</p>
            <p class="font-medium">{{transaction.paymentMethod}}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div *ngFor="let history of transactionHistory" 
               class="border-l-4 border-blue-500 pl-4 py-2">
            <p class="text-sm text-gray-500">
              {{history.timestamp | date:'medium'}}
            </p>
            <p class="font-medium">{{history.action}}</p>
            <p class="text-sm">{{history.description}}</p>
            <p class="text-sm text-gray-500">By: {{history.performedBy}}</p>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end mt-6">
        <button mat-button (click)="close()">Close</button>
      </div>
    </div>
  `
})
export class TransactionHistoryDialogComponent {
  // transaction: Transaction;
  // transactionHistory: TransactionHistory[] = [
  //   {
  //     timestamp: new Date(),
  //     action: 'Transaction Created',
  //     description: 'Payment initiated',
  //     performedBy: 'System',
  //     successRate: '',
  //     totalAmount: '',
  //     transactionCount: undefined
  //   },
  //   // Add more history items as needed
  // ];

  constructor(
    public dialogRef: MatDialogRef<TransactionHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Transaction
  ) {
    this.transaction = data;
  }

  close(): void {
    this.dialogRef.close();
  }
}