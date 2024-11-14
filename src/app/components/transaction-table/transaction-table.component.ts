// transaction-table.component.ts
import { Component, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Transaction } from '../../types';
import Chart, { ChartData } from 'chart.js/auto';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ReconciliationService } from '../../service/reconciliation.service';
import { TransactionModalComponent } from "../transactoin.modal";
// import { TransactionHistoryDialogComponent } from './transaction-history-dialog.component';

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    TransactionModalComponent
],
  templateUrl: './transaction-table.component.html',
  styleUrls: ['./transaction-table.component.scss']
})
export class TransactionTableComponent {
  @Input() transactions: Transaction[] = [];
    @ViewChild('transactionChart') transactionChart!: ElementRef;
  @ViewChild('profitChart') profitChart!: ElementRef;
  dateRange: { start: Date; end: Date; } | undefined;
    selectedTransaction: any = null;
  showModal = false;
  filter = {
    endDate: '2024-11-13',
    roleId: '63de11f56e0e069e7b633465',
    startDate: '2024-11-12',
    status: 'PAID',
    transaction_type: 'DEBIT'
  };

  
  
  displayedColumns: string[] = [
    'date',
    'transactionId',
    'transactionNumber',
    'paymentMethod',
    'amount',
    'bankFee',
    'profit',
    'status',
    'actions'
  ];

  totals = {
    amount: 0,
    bankFee: 0,
    profit: 0
  };
   // Filter properties
  filters = {
    id: '',
    transactionNumber: '',
    status: ''
  };
  
  filteredTransactions: Transaction[] = [];
  statusOptions = ['success', 'bounced', 'cancelled', 'dropped'];
  reconciliationService: any;

   loadTransactions() {
    this.reconciliationService.getTransactions()
      .subscribe({
        next: (transactions: Transaction[]) => {
          this.transactions = transactions;
          // this.summary = this.reconciliationService.getTransactionSummary(transactions);
          this.updateCharts();
        },
        error: (error: any) => {
          console.error('Error loading transactions', error);
        }
      });
   }
  
  
  
  
  


  
  // Charts
  charts: { [key: string]: Chart } = {};
  
  // constructor(private dialog: MatDialog) {
  //   this.dateRange = {
  //     start: new Date(new Date().setDate(new Date().getDate() - 30)),
  //     end: new Date()
  //   };
  // }
  
 
  ngAfterViewInit() {
    this.initializeCharts();
  }

  initializeCharts() {
    // Daily Transaction Volume Chart
    const transactionCtx = this.transactionChart.nativeElement.getContext('2d');
    this.charts['transaction'] = new Chart<'line', (number | [number, number] | null)[], string>(transactionCtx, {
      type: 'line',
      data: this.getTransactionChartData(),
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Daily Transaction Volume'
          }
        }
      }
    });

    // Profit Distribution Chart
    const profitCtx = this.profitChart.nativeElement.getContext('2d');
    this.charts['profit'] = new Chart(profitCtx, {
      type: 'bar',
      data: this.getProfitChartData(),
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Profit vs Bank Fees'
          }
        }
      }
    });
  }

  getTransactionChartData(): ChartData<'line', (number | [number, number] | null)[], string> {
    const dailyTotals = this.groupTransactionsByDate();
    return {
      labels: Object.keys(dailyTotals),
      datasets: [{
        label: 'Transaction Volume',
        data: Object.values(dailyTotals),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }]
    };
  }

  getProfitChartData() {
    const profitData = this.groupProfitData();
    return {
      labels: Object.keys(profitData.dates),
      datasets: [
        {
          label: 'Profit',
          data: profitData.profits,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Bank Fees',
          data: profitData.fees,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }
      ]
    };
  }

  groupTransactionsByDate() {
    return this.filteredTransactions.reduce((acc: any, curr) => {
      const date = new Date(curr.date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + curr.amount;
      return acc;
    }, {});
  }

  groupProfitData() {
    const data = this.filteredTransactions.reduce((acc: any, curr) => {
      const date = new Date(curr.date).toLocaleDateString();
      if (!acc.dates[date]) {
        acc.dates[date] = true;
        acc.profits.push(curr.profit);
        acc.fees.push(curr.bankFee);
      } else {
        const index = Object.keys(acc.dates).indexOf(date);
        acc.profits[index] += curr.profit;
        acc.fees[index] += curr.bankFee;
      }
      return acc;
    }, { dates: {}, profits: [], fees: [] });
    return data;
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter(transaction => {
      return (
        transaction.id.toLowerCase().includes(this.filters.id.toLowerCase()) &&
        transaction.transactionNumber.toLowerCase().includes(this.filters.transactionNumber.toLowerCase()) &&
        (this.filters.status === '' || transaction.status === this.filters.status)
      );
    });
    
    this.calculateTotals();
    this.updateCharts();
  }

  updateCharts() {
    if (this.charts['transaction']) {
      this.charts['transaction'].data = this.getTransactionChartData();
      this.charts['transaction'].update();
    }
    if (this.charts['profit']) {
      this.charts['profit'].data = this.getProfitChartData();
      this.charts['profit'].update();
    }
  }

  resetFilters() {
    this.filters = {
      id: '',
      transactionNumber: '',
      status: ''
    };
    this.filteredTransactions = [...this.transactions];
    this.calculateTotals();
    this.updateCharts();
  }

  constructor(private transactionService: ReconciliationService) { }

  

 getTransaction() {
  const payload = {
      endDate: this.filter.endDate,
      roleId: this.filter.roleId,
      startDate: this.filter.startDate,
      status: this.filters.status,
      transaction_type: this.filter.transaction_type
    };
    this.transactionService.getTransactionss().subscribe(
      (data: Transaction[]) => {
        this.transactions = data;
        console.log('Transactions:', this.transactions);
      },
      (error: any) => {
        console.error('Error fetching transactions:', error);
      }
    );
 }
  




  ngOnInit() {
    this.calculateTotals();
       this.filteredTransactions = [...this.transactions];
    this.calculateTotals();
  }

  calculateTotals() {
    this.totals = this.transactions.reduce((acc, curr) => ({
      amount: acc.amount + curr.amount,
      bankFee: acc.bankFee + curr.bankFee,
      profit: acc.profit + curr.profit
    }), { amount: 0, bankFee: 0, profit: 0 });
  }


  openTransactionModal(transaction: any) {
    this.selectedTransaction = transaction;
    this.showModal = true;
  }

  closeTransactionModal() {
    this.showModal = false;
    this.selectedTransaction = null;
  }


  // viewHistory(transaction: Transaction) {
  //   this.dialog.open(TransactionHistoryDialogComponent, {
  //     width: '600px',
  //     data: transaction
  //   });
  // }

  getStatusColor(status: 'success' | 'bounced' | 'cancelled' | 'dropped'): string {
    const colors: { [key in 'success' | 'bounced' | 'cancelled' | 'dropped']: string } = {
      success: 'bg-green-100 text-green-800',
      bounced: 'bg-red-100 text-red-800',
      cancelled: 'bg-orange-100 text-orange-800',
      dropped: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || '';
  }


  
}