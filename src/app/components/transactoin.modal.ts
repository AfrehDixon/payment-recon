import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiTransaction } from '../types';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Transaction Details</h3>
            <button 
              (click)="close.emit()"
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="mt-2">
            <div class="flex items-center space-x-2">
              <span [class]="'px-3 py-1 rounded-full text-sm font-medium ' + getStatusClass(transaction?.status || '')">
                {{transaction?.status}}
              </span>
              <span class="text-sm text-gray-500">{{transaction?.createdAt | date:'medium'}}</span>
            </div>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <!-- Transaction Info -->
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-4">
              <h4 class="text-sm font-medium text-gray-500">Transaction Information</h4>
              <div class="space-y-2">
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Reference ID</span>
                  <span class="text-sm font-medium">{{transaction?.transactionRef}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">External ID</span>
                  <span class="text-sm font-medium">{{transaction?.externalTransactionId}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Type</span>
                  <span class="text-sm font-medium">{{transaction?.transaction_type}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Channel</span>
                  <span class="text-sm font-medium">{{transaction?.['channel']}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Description</span>
                  <span class="text-sm font-medium">{{transaction?.description}}</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="text-sm font-medium text-gray-500">Amount Details</h4>
              <div class="space-y-2">
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Amount</span>
                  <span class="text-sm font-medium text-green-600">
                    {{transaction?.currency}} {{transaction?.amount | number:'1.2-2'}}
                  </span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Actual Amount</span>
                  <span class="text-sm font-medium">
                    {{transaction?.currency}} {{transaction?.actualAmount | number:'1.2-2'}}
                  </span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Charges</span>
                  <span class="text-sm font-medium text-red-600">
                    {{transaction?.currency}} {{transaction?.charges | number:'1.2-2'}}
                  </span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Profit</span>
                  <span class="text-sm font-medium text-blue-600">
                    {{transaction?.currency}} {{transaction?.profitEarned | number:'1.2-2'}}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Details -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-gray-500">Customer Details</h4>
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Name</span>
                  <span class="text-sm font-medium">{{transaction?.payment_account_name}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Account Number</span>
                  <span class="text-sm font-medium">{{transaction?.payment_account_number}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Account Type</span>
                  <span class="text-sm font-medium">{{transaction?.payment_account_type}}</span>
                </div>
              </div>
              <div class="space-y-2">
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Issuer</span>
                  <span class="text-sm font-medium">{{transaction?.payment_account_issuer | uppercase}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Customer Type</span>
                  <span class="text-sm font-medium">{{transaction?.customerType}}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Info -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-gray-500">Additional Information</h4>
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Debit Operator</span>
                  <span class="text-sm font-medium">{{transaction?.['debitOperator']}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Charge Type</span>
                  <span class="text-sm font-medium">{{transaction?.['charge_type']}}</span>
                </div>
              </div>
              <div class="space-y-2">
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Balance Before</span>
                  <span class="text-sm font-medium">{{transaction?.['balanceBeforCredit'] | number:'1.2-2'}}</span>
                </div>
                <div class="grid grid-cols-2">
                  <span class="text-sm text-gray-500">Balance After</span>
                  <span class="text-sm font-medium">{{transaction?.['balanceAfterCredit'] | number:'1.2-2'}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 border-t border-gray-200">
          <button
            (click)="close.emit()"
            class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TransactionModalComponent {
  @Input() transaction: ApiTransaction | null = null;
  @Output() close = new EventEmitter<void>();

  getStatusClass(status: string): string {
    const classes = {
      'PAID': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'INITIATED': 'bg-blue-100 text-blue-800'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }
}