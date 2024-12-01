import { Component, Input, ViewChild, ElementRef, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import Chart from 'chart.js/auto';
import { TransactionModalComponent } from '../transactoin.modal';
import { ApiTransaction } from '../../types';
import { EnumPaymentTransactionStatus, EnumTransactionTypes } from '../../models/transaction.modal';
import { FormGroup } from '@angular/forms';

interface CustomerId {
  _id: string;
  autosettle: boolean;
  debitCardOperator: string;
  debitOperator: string;
  creditOperator: string;
}

// interface ApiTransaction {
//   _id: string;
//   actualAmount: number;
//   amount: number;
//   balanceAfterCredit: number;
//   balanceBeforCredit: number;
//   callbackUrl: string;
//   channel: string;
//   charge_type: string;
//   charges: number;
//   createdAt: string;
//   currency: string;
//   customerId: CustomerId;
//   customerType: string;
//   debitOperator: string;
//   description: string;
//   externalTransactionId: string;
//   payment_account_issuer: string;
//   payment_account_name: string;
//   payment_account_number: string;
//   payment_account_type: string;
//   processAttempts: number;
//   profitEarned: number;
//   reason: string;
//   recipient_account_issuer_name: string;
//   recipient_account_name: string;
//   recipient_account_number: string;
//   recipient_account_type: string;
//   status: string;
//   transactionRef: string;
//   transaction_type: string;
// }

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionModalComponent ],
  templateUrl: './transaction-table.component.html',
})
export class TransactionTableComponent implements OnInit {
  [x: string]: any;
  @Input() transactions: ApiTransaction[] = [];
  @ViewChild('transactionChart') transactionChart!: ElementRef;
  @ViewChild('profitChart') profitChart!: ElementRef;
  Math = Math;

  calculateFeesAndProfit(amount: number): { bankFee: number; companyFee: number } {
    const bankFeeRate = 0.01;   // 1%
    const companyFeeRate = 0.002; // 0.2%
    const increment = 25;

    const numIncrements = Math.floor(amount / increment);
    const remainder = amount % increment;

    let bankFee = 0;
    let companyFee = 0;

    if (numIncrements > 0) {
      bankFee += numIncrements * (increment * bankFeeRate);
      companyFee += numIncrements * (increment * companyFeeRate);
    }

    if (remainder > 0) {
      bankFee += remainder * bankFeeRate;
      companyFee += remainder * companyFeeRate;
    }

    return {
      bankFee: Number(bankFee.toFixed(2)),
      companyFee: Number(companyFee.toFixed(2))
    };
  }

  dateRange = {
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  };

  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  displayedTransactions: ApiTransaction[] = [];

 

  totals = {
    amount: 0,
    bankFee: 0,
    profit: 0,
  };

  statusOptions = ['PAID', 'FAILED', 'PENDING', 'INITIATED'];
  typesOptions = ['DEBIT', 'CREDIT', 'SETTLEMENT']
   formGroup!: FormGroup;
  filteredTransactions: ApiTransaction[] = [];
  selectedTransaction: ApiTransaction | null = null;
  showModal = false;
  charts: { [key: string]: Chart } = {};
   filters = {
    id: '',
    transactionNumber: '',
    status: '',
    transactionType: EnumTransactionTypes.CREDIT // Initialize with CREDIT
  };

  ngOnInit() {
    if (this.transactions?.length > 0) {
      this.initializeData();
    }
  }

  private initializeData() {
    this.filteredTransactions = [...this.transactions];
    this.calculateTotals();
    this.updateDisplayedTransactions();
    
    // Initialize charts after a small delay to ensure the view is ready
    setTimeout(() => {
      if (this.transactionChart && this.profitChart) {
        this.initializeCharts();
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['transactions'] && changes['transactions'].currentValue) {
      console.log('Transactions updated:', this.transactions.length);
      this.initializeData();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeCharts();
    }, 0);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updateDisplayedTransactions();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updateDisplayedTransactions();
  }

  updateDisplayedTransactions() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedTransactions = this.filteredTransactions.slice(start, end);
    this.totalItems = this.filteredTransactions.length;
  }

  // calculateTotals(): void {
  //   this.totals = this.filteredTransactions.reduce(
  //     (acc, curr) => ({
  //       amount: acc.amount + curr.amount,
  //       bankFee: acc.bankFee + curr.charges,
  //       profit: acc.profit + curr.profitEarned,
  //     }),
  //     { amount: 0, bankFee: 0, profit: 0 }
  //   );
  // }

  calculateTotals(): void {
    this.totals = this.filteredTransactions.reduce((acc, curr) => {
      const fees = this.calculateFeesAndProfit(curr.amount);
      return {
        amount: acc.amount + curr.amount,
        bankFee: acc.bankFee + fees.bankFee,
        profit: acc.profit + fees.companyFee
      };
    }, { amount: 0, bankFee: 0, profit: 0 });
  }


   groupProfitData() {
    return this.filteredTransactions.reduce((acc, curr) => {
      const date = new Date(curr.createdAt).toLocaleDateString();
      const fees = this.calculateFeesAndProfit(curr.amount);
      
      if (!acc.dates[date]) {
        acc.dates[date] = true;
        acc.profits.push(fees.companyFee);
        acc.charges.push(fees.bankFee);
      } else {
        const index = Object.keys(acc.dates).indexOf(date);
        acc.profits[index] += fees.companyFee;
        acc.charges[index] += fees.bankFee;
      }
      return acc;
    }, { dates: {} as { [key: string]: boolean }, profits: [] as number[], charges: [] as number[] });
  }

  getTotalAmount(): number {
    return this.filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalCharges(): number {
    const totalCharges = this.filteredTransactions.reduce((sum, t) => {
      const fees = this.calculateFeesAndProfit(t.amount);
      return sum + fees.bankFee;
    }, 0);
    return Number(totalCharges.toFixed(2));
  }
  

  getTotalProfit(): number {
    const totalProfit = this.filteredTransactions.reduce((sum, t) => {
      const fees = this.calculateFeesAndProfit(t.amount);
      return sum + fees.companyFee;
    }, 0);
    return Number(totalProfit.toFixed(2));
  }

  initializeCharts(): void {
    if (this.charts['transaction']) {
      this.charts['transaction'].destroy();
    }
    if (this.charts['profit']) {
      this.charts['profit'].destroy();
    }
  
    const transactionCtx = this.transactionChart.nativeElement.getContext('2d');
    this.charts['transaction'] = new Chart(transactionCtx, {
      type: 'line',
      data: this.getTransactionChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { display: true, text: 'Daily Transaction Volume' },
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
      },
    });
  
    const profitCtx = this.profitChart.nativeElement.getContext('2d');
    this.charts['profit'] = new Chart(profitCtx, {
      type: 'bar',
      data: this.getProfitChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { display: true, text: 'Profit Analysis' },
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
      },
    });
  }

  getTransactionChartData() {
    const dailyTotals = this.groupTransactionsByDate();
    return {
      labels: Object.keys(dailyTotals),
      datasets: [
        {
          label: 'Transaction Volume',
          data: Object.values(dailyTotals),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
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
          label: 'Charges',
          data: profitData.charges,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  }

  groupTransactionsByDate() {
    return this.filteredTransactions.reduce((acc, curr) => {
      const date = new Date(curr.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + curr.amount;
      return acc;
    }, {} as { [key: string]: number });
  }

  // groupProfitData() {
  //   return this.filteredTransactions.reduce(
  //     (acc, curr) => {
  //       const date = new Date(curr.createdAt).toLocaleDateString();
  //       if (!acc.dates[date]) {
  //         acc.dates[date] = true;
  //         acc.profits.push(curr.profitEarned);
  //         acc.charges.push(curr.charges);
  //       } else {
  //         const index = Object.keys(acc.dates).indexOf(date);
  //         acc.profits[index] += curr.profitEarned;
  //         acc.charges[index] += curr.charges;
  //       }
  //       return acc;
  //     },
  //     {
  //       dates: {} as { [key: string]: boolean },
  //       profits: [] as number[],
  //       charges: [] as number[],
  //     }
  //   );
  // }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      INITIATED: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  applyFilters(): void {
    if (!this.transactions) return;
    
    this.filteredTransactions = this.transactions.filter((transaction) => {
      const matchesId = transaction.transactionRef
        .toLowerCase()
        .includes(this.filters.id.toLowerCase());
      const matchesNumber = transaction._id
        .toLowerCase()
        .includes(this.filters.transactionNumber.toLowerCase());
      const matchesStatus =
        !this.filters.status || transaction.status === this.filters.status;
      return matchesId && matchesNumber && matchesStatus;
    });
    
    this.calculateTotals();
    this.updateDisplayedTransactions();
    this.updateCharts();
  }

 

  resetFilters(): void {
    this.filters = {
      id: '',
      transactionNumber: '',
      status: '',
      transactionType: EnumTransactionTypes.CREDIT
    };
    this.filteredTransactions = [...this.transactions];
    this.calculateTotals();
    this.updateDisplayedTransactions();
    this.updateCharts();
  }

  updateCharts(): void {
    if (this.charts['transaction']) {
      this.charts['transaction'].data = this.getTransactionChartData();
      this.charts['transaction'].update();
    }
    if (this.charts['profit']) {
      this.charts['profit'].data = this.getProfitChartData();
      this.charts['profit'].update();
    }
  }


   private setupFormGroup() {
    this.formGroup = new FormGroup({
      startDate: new FormControl(
        new Date(new Date().valueOf() - 1000 * 60 * 60 * 24).toLocaleDateString('en-CA')
      ),
      endDate: new FormControl(new Date().toLocaleDateString('en-CA')),
      roleId: new FormControl(this['userId'], Validators.required),
      status: new FormControl(EnumPaymentTransactionStatus.PAID, Validators.required),
      transaction_type: new FormControl(this.filters.transactionType, Validators.required),
    });
   }
  


   applyFilter(): void {
    this.filteredTransactions = this.transactions.filter((transaction) => {
      const matchesId = transaction.transactionRef
        .toLowerCase()
        .includes(this.filters.id.toLowerCase());
      const matchesNumber = transaction._id
        .toLowerCase()
        .includes(this.filters.transactionNumber.toLowerCase());
      const matchesStatus =
        !this.filters.status || transaction.status === this.filters.status;
      const matchesTransactionType =
        !this.filters.transactionType || transaction.transaction_type === this.filters.transactionType;
      return matchesId && matchesNumber && matchesStatus && matchesTransactionType;
    });
    this.calculateTotals();
    this.updateCharts();
  }

  openTransactionModal(transaction: ApiTransaction): void {
    this.selectedTransaction = transaction;
    this.showModal = true;
  }

  closeTransactionModal(): void {
    this.showModal = false;
    this.selectedTransaction = null;
  }

  loadTransactions(): void {
    // Implement your transaction loading logic here
  }

  // getTotalAmount(): number {
  //   return this.filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  // }

  // getTotalCharges(): number {
  //   return this.filteredTransactions.reduce((sum, t) => sum + t.charges, 0);
  // }

  // getTotalProfit(): number {
  //   return this.filteredTransactions.reduce(
  //     (sum, t) => sum + t.profitEarned,
  //     0
  //   );
  // }
}
