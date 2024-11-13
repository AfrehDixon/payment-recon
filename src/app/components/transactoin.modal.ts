// transaction-modal.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
         (click)="closeModal()">
      <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4" 
           (click)="$event.stopPropagation()">
        <!-- Modal header -->
        <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
          <h3 class="text-xl font-semibold text-gray-900">
            Transaction Details
          </h3>
          <button type="button" 
                  class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 flex items-center justify-center"
                  (click)="closeModal()">
            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
          </button>
        </div>

        <!-- Modal body -->
        <div class="p-4 md:p-5 space-y-4">
          <!-- Transaction Info Grid -->
          <div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="text-sm text-gray-500">Transaction ID</p>
              <p class="font-medium">{{transaction?.id}}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Transaction Number</p>
              <p class="font-medium">{{transaction?.transactionNumber}}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Date</p>
              <p class="font-medium">{{transaction?.date | date:'medium'}}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Payment Method</p>
              <p class="font-medium">{{transaction?.paymentMethod}}</p>
            </div>
          </div>

          <!-- Financial Details -->
          <div class="space-y-4">
            <h4 class="text-lg font-medium">Financial Summary</h4>
            <div class="grid grid-cols-3 gap-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-500">Amount</p>
                <p class="text-lg font-semibold">GHS{{transaction?.amount | number:'1.2-2'}}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-500">Bank Fee</p>
                <p class="text-lg font-semibold text-red-600">GHS{{transaction?.bankFee | number:'1.2-2'}}</p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-500">Net Profit</p>
                <p class="text-lg font-semibold text-green-600">GHS{{transaction?.profit | number:'1.2-2'}}</p>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-500 mb-2">Status</p>
            <span [class]="'px-3 py-1 text-sm font-medium rounded-full ' + getStatusColor(transaction?.status)">
              {{transaction?.status}}
            </span>
          </div>

          <!-- Transaction Timeline -->
          <div class="space-y-4">
            <h4 class="text-lg font-medium">Transaction Timeline</h4>
            <div class="space-y-4">
              <div class="flex gap-4">
                <div class="flex flex-col items-center">
                  <div class="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                  <div class="w-px h-full bg-blue-600"></div>
                </div>
                <div class="flex-1 pb-4">
                  <p class="text-sm font-medium">Transaction Initiated</p>
                  <p class="text-sm text-gray-500">{{transaction?.date | date:'medium'}}</p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="flex flex-col items-center">
                  <div class="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                  <div class="w-px h-full bg-blue-600"></div>
                </div>
                <div class="flex-1 pb-4">
                  <p class="text-sm font-medium">Payment Processed</p>
                  <p class="text-sm text-gray-500">{{transaction?.date | date:'medium'}}</p>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="flex flex-col items-center">
                  <div class="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium">Transaction Completed</p>
                  <p class="text-sm text-gray-500">{{transaction?.date | date:'medium'}}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal footer -->
        <div class="flex items-center justify-end p-4 md:p-5 border-t border-gray-200 rounded-b">
          <button type="button" 
                  class="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  (click)="closeModal()">
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

    .modal-backdrop {
      animation: fadeIn 0.2s ease-in-out;
    }

    .modal-content {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateY(-10%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class TransactionModalComponent {
  @Input() transaction: any;
  showModal = true;
  selectedTransaction: null | undefined;

  constructor() {}

  closeModal() {
    this.showModal = false;
    this.selectedTransaction = null;
  }

 

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