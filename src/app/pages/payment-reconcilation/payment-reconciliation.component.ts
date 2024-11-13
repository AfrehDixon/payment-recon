// payment-reconciliation.component.ts
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { Transaction,} from '../../types';
import { ChartConfiguration } from 'chart.js';
import { ReconciliationService } from '../../service/reconciliation.service';
import { TransactionTableComponent } from "../../components/transaction-table/transaction-table.component";

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
  // summary: TransactionHistory | undefined;
  dateRange: { start: Date; end: Date; };

  transactionChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };
summary: any;

  constructor(private reconciliationService: ReconciliationService) {
    this.dateRange = {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date()
    };
  }

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.reconciliationService.getTransactions()
      .subscribe({
        next: (transactions: Transaction[]) => {
          this.transactions = transactions;
          // this.summary = this.reconciliationService.getTransactionSummary(transactions);
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