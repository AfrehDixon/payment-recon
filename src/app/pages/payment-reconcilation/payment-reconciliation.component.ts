import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReconciliationService } from '../../service/reconciliation.service';
import { TransactionTableComponent } from "../../components/transaction-table/transaction-table.component";
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import { EnumPaymentTransactionStatus, EnumTransactionTypes } from '../../models/transaction.modal';
import { ApiTransaction } from '../../types';

@Component({
  selector: 'app-payment-reconciliation',
  standalone: true,
  templateUrl: './payment-reconciliation.component.html',
  styleUrls: ['./payment-reconciliation.component.css'],
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatTableModule,
    CommonModule,
    ReactiveFormsModule,
    TransactionTableComponent
  ]
})
export class PaymentReconciliationComponent implements OnInit {
  transactions: ApiTransaction[] = [];
  userId: string;
  formGroup!: FormGroup;
  dateRange!: { start: Date; end: Date; };
  summary = {
    totalAmount: 0,
    transactionCount: 0,
    successRate: 0
  };

  constructor(
    private store: Store,
    private reconciliationService: ReconciliationService
  ) {
    this.userId = this.store.selectSnapshot(AuthState.user).merchantId._id;
    this.setupFormGroup();
    this.setupDateRange();
  }

  private setupFormGroup() {
    this.formGroup = new FormGroup({
      startDate: new FormControl(
        new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 7).toLocaleDateString('en-CA')
      ),
      endDate: new FormControl(new Date().toLocaleDateString('en-CA')),
      roleId: new FormControl(this.userId, Validators.required),
      status: new FormControl(EnumPaymentTransactionStatus.PAID, Validators.required),
      transaction_type: new FormControl(EnumTransactionTypes.CREDIT, Validators.required),
    });
  }

  private setupDateRange() {
    this.dateRange = {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date()
    };
  }

  ngOnInit() {
    this.getReport();
  }

  getReport() {
    const payload = {
      startDate: this.formGroup.get('startDate')?.value,
      endDate: this.formGroup.get('endDate')?.value,
      merchantId: this.formGroup.get('roleId')?.value,
      status: this.formGroup.get('status')?.value,
      transaction_type: this.formGroup.get('transaction_type')?.value,
    };

    this.reconciliationService.getTransactions(payload).subscribe({
      next: (response: any) => {
        // console.log('API Response:', response);
        
        // Handle the array response directly
        if (Array.isArray(response)) {
          this.transactions = [...response];
          
          // Calculate summary from the transactions array
          const totalAmount = this.transactions.reduce((sum, t) => sum + t.amount, 0);
          const successRate = this.calculateSuccessRate(this.transactions);
          
          this.summary = {
            totalAmount: totalAmount,
            transactionCount: this.transactions.length,
            successRate: successRate
          };
          
          // console.log('Updated transactions:', this.transactions);
          // console.log('Updated summary:', this.summary);
        } else if (response?.data?.transactions) {
          // Handle the nested object response if that format is returned
          this.transactions = [...response.data.transactions];
          this.summary = {
            totalAmount: response.data.amount || 0,
            transactionCount: response.data.count || 0,
            successRate: this.calculateSuccessRate(this.transactions)
          };
        }
      },
      error: (error) => {
        // console.error('Error loading transactions', error);
        this.transactions = [];
      }
    });
  }

  private calculateSuccessRate(transactions: ApiTransaction[]): number {
    if (!transactions.length) return 0;
    const successfulTransactions = transactions.filter(t => t.status === 'PAID').length;
    return (successfulTransactions / transactions.length) * 100;
  }
}