import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Transaction } from '../../types';
import { ChartConfiguration } from 'chart.js';
import { ReconciliationService } from '../../service/reconciliation.service';
import { TransactionTableComponent } from "../../components/transaction-table/transaction-table.component";
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import { EnumPaymentTransactionStatus, EnumTransactionTypes } from '../../models/transaction.modal';

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
    TransactionTableComponent
  ]
})
export class PaymentReconciliationComponent implements OnInit {
  transactions: Transaction[] = [];
  userId: string;
  formGroup: FormGroup;
  dateRange: { start: Date; end: Date };
  transactionChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };
  summary: any;

  

  constructor(private store: Store, private reconciliationService: ReconciliationService) {
    this.userId = this.store.selectSnapshot(AuthState.user)._id;
    this.formGroup = new FormGroup({
      startDate: new FormControl(
        new Date(new Date().valueOf() - 1000 * 60 * 60 * 24).toLocaleDateString('en-CA')
      ),
      endDate: new FormControl(new Date().toLocaleDateString('en-CA')),
      roleId: new FormControl(this.userId, Validators.required),
      status: new FormControl(EnumPaymentTransactionStatus.PAID, Validators.required),
      transaction_type: new FormControl(EnumTransactionTypes.DEBIT, Validators.required),
    });
    this.dateRange = {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date()
    };
  }

  ngOnInit() {
    // this.getReport();
  }
  

  getReport() {
    const payload = {
      startDate: this.formGroup.get('startDate')?.value,
      endDate: this.formGroup.get('endDate')?.value,
      roleId: this.formGroup.get('roleId')?.value,
      status: this.formGroup.get('status')?.value,
      transaction_type: this.formGroup.get('transaction_type')?.value,
    };

    this.reconciliationService.getTransactions(payload).subscribe({
      next: (transactions: Transaction[]) => {
        this.transactions = transactions;
        this.updateCharts();
      },
      error: (error) => {
        console.error('Error loading transactions', error);
      }
    });
  }

  private updateCharts() {
    const dailyTotals = this.transactions.reduce((acc, curr) => {
      const date = new Date(curr.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + curr.amount;
      return acc;
    }, {} as { [key: string]: number });

    this.transactionChartData = {
      labels: Object.keys(dailyTotals),
      datasets: [{
        data: Object.values(dailyTotals),
        label: 'Daily Transaction Volume',
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  }
}