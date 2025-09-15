import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

const BASE_URL = 'https://doronpay.com/api';

interface CardWallet {
  _id: string;
  tokenId: string;
  account_issuer: string;
  account_name: string;
  account_number: string;
  account_type: string;
  createdAt: string;
  updatedAt: string;
  merchantId: string;
  __v: number;
}

@Component({
  selector: 'app-card-wallets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './card-wallets.component.html',
  styleUrls: ['./card-wallets.component.scss']
})
export class CardWalletsComponent implements OnInit {
  wallets: CardWallet[] = [];
  filteredWallets: CardWallet[] = [];
  paginatedWallets: CardWallet[] = [];
  loading = false;
  error: string | null = null;
  showDeleteConfirmation = false;
  selectedWallet: CardWallet | null = null;
  searchTerm: string = '';

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadWallets();
  }

  loadWallets(): void {
    this.loading = true;
    this.http.get<any>(`${BASE_URL}/wallets/get`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.wallets = response.data;
            this.filteredWallets = this.wallets;
            this.updatePagination();
          } else {
            this.error = 'Failed to load wallets';
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'An error occurred while loading wallets';
          this.loading = false;
        }
      });
  }

  searchWallets(event: KeyboardEvent): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = searchTerm;
    this.filterWallets();
  }

  filterWallets(): void {
    if (!this.searchTerm.trim()) {
      this.filteredWallets = this.wallets;
    } else {
      this.filteredWallets = this.wallets.filter(wallet => {
        return (
          (wallet.account_number && wallet.account_number.toLowerCase().includes(this.searchTerm)) ||
          (wallet.account_name && wallet.account_name.toLowerCase().includes(this.searchTerm)) ||
          (wallet.account_issuer && wallet.account_issuer.toLowerCase().includes(this.searchTerm)) ||
          (wallet.tokenId && wallet.tokenId.toLowerCase().includes(this.searchTerm))
        );
      });
    }
    this.currentPage = 1; // Reset to first page when filtering
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalItems = this.filteredWallets.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    
    this.updatePaginatedWallets();
  }

  updatePaginatedWallets(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedWallets = this.filteredWallets.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedWallets();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedWallets();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedWallets();
    }
  }

  changeItemsPerPage(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage = parseInt(target.value);
    this.currentPage = 1;
    this.updatePagination();
  }

  getVisiblePages(): number[] {
    const maxVisible = 5;
    const pages: number[] = [];
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.itemsPerPage, this.totalItems);
  }

  openDeleteConfirmation(wallet: CardWallet): void {
    this.selectedWallet = wallet;
    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.selectedWallet = null;
  }

  deleteWallet(): void {
    if (this.selectedWallet) {
      this.loading = true;
      this.http.delete<any>(`${BASE_URL}/wallets/delete/${this.selectedWallet._id}`)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadWallets();
              this.closeDeleteConfirmation();
              this.error = 'Wallet deleted successfully';
              setTimeout(() => {
                this.error = null;
              }, 3000);
            } else {
              this.error = response.message || 'Failed to delete wallet';
            }
            this.loading = false;
          },
          error: (error) => {
            this.error = 'An error occurred while deleting the wallet';
            this.loading = false;
          }
        });
    }
  }

  formatAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '';
    return accountNumber.replace(/(\d{4})/g, '$1 ').trim();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}