import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import API from '../../constants/api.constant';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { catchError, finalize, forkJoin, map, of, take } from 'rxjs';
// import { SetAllMerchants } from '../../types';
import { SetAllMerchants } from '../../auth/auth.action';

interface Merchant {
  id: number;
  name: string;
  balance: number;
  status: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'app-merchant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './merchants.component.html'
})
export class MerchantComponent implements OnInit {
  merchants: Merchant[] = [];
  showTopUpModal = false;
  selectedMerchantId?: number;
  topUpForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private http: HttpClient, 
    private store: Store, 
    private fb: FormBuilder
  ) {
    this.topUpForm = this.fb.group({
      amount: ['', [
        Validators.required, 
        Validators.min(1),
        Validators.max(10000)
      ]]
    });
  }

  ngOnInit(): void {
    this.getAllMerchant();
  }

  getAllMerchants(): void {
  this.isLoading = true;
  this.error = null;

  this.http.get<{success: boolean, data: Merchant[]}>(`${API}/merchants/get`)
    .pipe(
      take(1),
      catchError(error => {
        this.error = error.message || 'Failed to load merchants';
        return of({ success: false, data: [] });
      })
    )
    .subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          // First check if merchant has an id before making balance request
          const validMerchants = response.data.filter(merchant => merchant && merchant.id);
          
          if (validMerchants.length) {
            const balanceRequests = validMerchants.map(merchant => 
              this.getMerchantBalance(merchant.id?.toString() || '')
                .pipe(map((balanceResponse: { success: any; data: { balance: any; }; }) => ({
                  ...merchant,
                  balance: balanceResponse.success ? balanceResponse.data?.balance || 0 : 0
                })))
            );

            forkJoin(balanceRequests)
              .pipe(finalize(() => this.isLoading = false))
              .subscribe({
                next: (merchantsWithBalance) => {
                  this.merchants = merchantsWithBalance;
                  this.store.dispatch(new SetAllMerchants(this.merchants));
                },
                error: (error) => {
                  this.error = 'Failed to load merchant balances';
                  this.isLoading = false;
                }
              });
          } else {
            this.merchants = [];
            this.isLoading = false;
          }
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.error = 'Failed to load merchants';
        this.isLoading = false;
        console.log('error')
      }
    });
}
  getMerchantBalance(merchantId: string) {
    return this.http.get<{ success: boolean, data: { balance: number } }>(`${API}/merchants/${merchantId}/balance`)
      .pipe(
        catchError(error => {
          this.error = error.message || 'Failed to load merchant balance';
          return of({ success: false, data: { balance: 0 } });
        })
      );
  }


  getAllMerchant(): void {
    this.isLoading = true;
    this.error = null;

    this.http
      .get<{success: boolean, data: Merchant[]}>(`${API}/merchants/get`)
      .pipe(
        take(1),
        catchError(error => {
          this.error = error.message || 'Failed to load merchants';
          return of({ success: false, data: [] });
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(response => {
        if (response.success) {
          this.merchants = response.data;
          this.store.dispatch(new SetAllMerchants(response.data));
        }
      });
  }

  openTopUpModal(merchantId: number): void {
    this.selectedMerchantId = merchantId;
    this.showTopUpModal = true;
  }

  closeTopUpModal(): void {
    this.showTopUpModal = false;
    this.topUpForm.reset();
  }

  submitTopUp(): void {
    if (this.topUpForm.valid && this.selectedMerchantId) {
      const amount = this.topUpForm.get('amount')?.value;
      
      this.http.post(`${API}/transaction/merchant/topup`, {
        merchantId: this.selectedMerchantId,
        amount: amount
      }).pipe(
        take(1),
        catchError(error => {
          this.error = error.message || 'Top-up failed';
          return of({ success: false });
        })
      ).subscribe(response => {
        // if (response.success) {
        //   this.getAllMerchants(); // Refresh merchant list
        //   this.closeTopUpModal();
        // }
      });
    }
  }
}