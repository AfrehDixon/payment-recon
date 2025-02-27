import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, take, of } from 'rxjs';
import API from '../../constants/api.constant';
import { FormsModule } from '@angular/forms';

interface Settlement {
  _id: string;
  merchantId: string;
  count: number;
  amountWithCharges: number;
  totalAmountWithoutCharges: number;
  totalCharges: number;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
    startDate: string;
    endDate: string;
  }

@Component({
  selector: 'app-merchant-settlements',
  standalone: true,
  imports: [CommonModule,FormsModule],
  template: `
    <div class="settlements-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Merchant Settlements</h1>
          <button class="back-btn" (click)="goBack()">
            <i class="fas fa-arrow-left"></i> Back to Merchants
          </button>
        </div>
      </div>

       <!-- Date Filter -->
      <div class="filter-section">
        <label for="startDate">Start Date:</label>
        <input type="date" id="startDate" [(ngModel)]="filterStartDate" (change)="filterByDate()" />

        <label for="endDate">End Date:</label>
        <input type="date" id="endDate" [(ngModel)]="filterEndDate" (change)="filterByDate()" />

        <button class="clear-btn" (click)="clearFilters()">
              Clear Filters
            </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <!-- Settlements Table -->
      <div class="table-container" *ngIf="!isLoading && paginatedSettlements.length > 0">
        <table class="settlements-table">
          <thead>
            <tr>
              <th>Settlement Date</th>
              <th>Period</th>
              <th>Transaction Count</th>
              <th>Amount</th>
              <th>Charges</th>
              <th>Total Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let settlement of paginatedSettlements">
              <td>{{ settlement.createdAt | date:'medium' }}</td>
              <td>
                {{ settlement.startDate | date:'MMM d, y' }} -
                {{ settlement.endDate | date:'MMM d, y' }}
              </td>
              <td>{{ settlement.count }}</td>
              <td>₵ {{ settlement.totalAmountWithoutCharges | number:'1.2-2' }}</td>
              <td>₵ {{ settlement.totalCharges | number:'1.2-2' }}</td>
              <td>₵ {{ settlement.amountWithCharges | number:'1.2-2' }}</td>
              <td>
                <span 
                  class="status-badge"
                  [class.confirmed]="settlement.status === 'CONFIRMED'"
                  [class.pending]="settlement.status === 'PENDING'"
                >
                  {{ settlement.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination-controls">
          <button 
            [disabled]="currentPage === 1" 
            (click)="previousPage()">
            Previous
          </button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            [disabled]="currentPage === totalPages" 
            (click)="nextPage()">
            Next
          </button>
        </div>
      </div>

      <!-- No Data State -->
      <div *ngIf="!isLoading && settlements.length === 0" class="no-data">
        No settlements found for this merchant.
      </div>
    </div>
  `,
  styles: [
    `
      .settlements-container {
        padding: 24px;
        background-color: #f8f9fa;
        min-height: 100vh;
        margin-left: 200px;
      }

      .header-section {
        margin-bottom: 32px;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .filter-section {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        align-items: center;
      }

      .filter-section label {
        font-weight: bold;
      }

      .filter-section input {
        padding: 8px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
      }

      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0;
      }

      .back-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background-color: #fff;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .back-btn:hover {
        background-color: #f8f9fa;
      }

      .table-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }

      .settlements-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .settlements-table th {
        background-color: #f8f9fa;
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        color: #495057;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #dee2e6;
      }

      .settlements-table td {
        padding: 16px;
        border-bottom: 1px solid #dee2e6;
        font-size: 14px;
      }

      .filters-section {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: end;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-top: 1px solid #dee2e6;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pagination-pages {
      display: flex;
      gap: 4px;
    }

    .page-btn {
      padding: 6px 12px;
      border: 1px solid #dee2e6;
      background-color: #fff;
      border-radius: 4px;
      cursor: pointer;
    }

    .page-btn.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .status-badge.confirmed {
        background-color: #d1fae5;
        color: #065f46;
      }

      .pagination-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 16px;
      }

      .pagination-controls button {
        padding: 8px 12px;
        margin: 0 8px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .pagination-controls button:disabled {
        background-color: #dee2e6;
        cursor: not-allowed;
      }

      .status-badge.pending {
        background-color: #fef3c7;
        color: #92400e;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        padding: 40px 0;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error-message {
        background-color: #fee2e2;
        color: #991b1b;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 16px;
      }

      .no-data {
        text-align: center;
        padding: 40px;
        background: white;
        border-radius: 8px;
        color: #6b7280;
      }
    `
  ]
})
export class MerchantSettlementsComponent implements OnInit {
  settlements: Settlement[] = [];
  paginatedSettlements: Settlement[] = [];
  isLoading = false;
  error: string | null = null;
  merchantId: string | null = null;
//   paginatedSettlements!: Settlement[] = [];
  filteredSettlements: Settlement[] = [];

  filterStartDate: string | null = null;
  filterEndDate: string | null = null;

  currentPage = 1;
  itemsPerPage = 10;

  filters: Filters = {
    startDate: '',
    endDate: '',
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.merchantId = this.route.snapshot.paramMap.get('id');
    if (this.merchantId) {
      this.loadSettlements();
    }
  }

  clearFilters(): void {
    this.filterStartDate = null;
    this.filterEndDate = null;
    this.filteredSettlements = [...this.settlements]; // Reset to original settlements
    this.currentPage = 1; // Reset to the first page
    this.updatePaginatedSettlements(); // Update pagination
  }
  

  loadSettlements(): void {
    if (!this.merchantId) return;

    this.isLoading = true;
    this.error = null;

    this.http.get<{success: boolean; message: string; data: Settlement[]}>(
      `${API}/settlements/merchant/${this.merchantId}`
    ).pipe(
      take(1),
      catchError(error => {
        console.error('Error:', error);
        this.error = 'Failed to load settlements';
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      if (response?.success) {
        this.settlements = response.data;
        this.filteredSettlements = this.settlements; // Initially set filtered to all
        this.updatePaginatedSettlements();
      }
    });
  }

  updatePaginatedSettlements(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedSettlements = this.filteredSettlements.slice(startIndex, endIndex);
  }

  filterByDate(): void {
    if (this.filterStartDate && this.filterEndDate) {
      const startDate = new Date(this.filterStartDate);
      const endDate = new Date(this.filterEndDate);

      this.filteredSettlements = this.settlements.filter(settlement => {
        const settlementDate = new Date(settlement.createdAt);
        return settlementDate >= startDate && settlementDate <= endDate;
      });
    } else {
      this.filteredSettlements = this.settlements;
    }

    this.currentPage = 1; // Reset to the first page after filtering
    this.updatePaginatedSettlements();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedSettlements();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedSettlements();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSettlements.length / this.itemsPerPage);
  }

  goBack(): void {
    window.history.back();
  }
}