import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';

enum TerminalType {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
}

enum TerminalStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  SUSPENDED = 'SUSPENDED',
}

interface Terminal {
  _id: string;
  terminalId: string;
  merchantId: string;
  name: string;
  description?: string;
  type: TerminalType;
  status: TerminalStatus;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  deviceId?: string;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
  qrCodeData: string;
  defaultAmount?: number;
  defaultCurrency?: string;
  defaultExpiryMinutes?: number;
}

interface PaymentLink {
  _id: string;
  linkId: string;
  merchantId: string;
  terminalId?: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  customerName?: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-payment-terminals',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen" style="margin-left: 200px;">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Payment Terminals</h1>
        <p class="text-gray-600">
          Manage physical and virtual payment terminals
        </p>
      </div>

      <!-- Action buttons -->
      <div class="mb-6 flex justify-end">
        <button
          (click)="showCreateForm()"
          class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <i class="material-icons text-sm align-middle mr-1">add</i>
          Create Terminal
        </button>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="flex justify-center py-8">
        <div
          class="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"
        ></div>
      </div>

      <!-- Error message -->
      <div
        *ngIf="error"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
      >
        <span class="block sm:inline">{{ error }}</span>
      </div>

      <!-- Success message -->
      <div
        *ngIf="successMessage"
        class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
      >
        <span class="block sm:inline">{{ successMessage }}</span>
      </div>

      <!-- Terminal creation form -->
      <div *ngIf="showForm" class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">
          Create New Terminal
        </h2>

        <form [formGroup]="terminalForm" (ngSubmit)="createTerminal()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Terminal Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Terminal Name *</label
              >
              <input
                type="text"
                formControlName="name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Checkout Counter 1"
              />
              <div
                *ngIf="
                  terminalForm.get('name')?.invalid &&
                  terminalForm.get('name')?.touched
                "
                class="mt-1 text-sm text-red-600"
              >
                Name is required
              </div>
            </div>

            <!-- Terminal Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Terminal Type *</label
              >
              <select
                formControlName="type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option [value]="TerminalType.PHYSICAL">
                  Physical Terminal
                </option>
                <option [value]="TerminalType.VIRTUAL">Virtual Terminal</option>
              </select>
            </div>

            <!-- Terminal Description -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Description</label
              >
              <textarea
                formControlName="description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter a description for this terminal"
              ></textarea>
            </div>

            <!-- Default Amount -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Default Amount (Optional)</label
              >
              <input
                type="number"
                formControlName="defaultAmount"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>

            <!-- Default Currency -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Default Currency</label
              >
              <select
                formControlName="defaultCurrency"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="GHS">GHS (Ghana Cedi)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="NGN">NGN (Nigerian Naira)</option>
              </select>
            </div>

            <!-- Default Expiry Minutes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Default Link Expiry (minutes)</label
              >
              <input
                type="number"
                formControlName="defaultExpiryMinutes"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="15"
              />
            </div>

            <!-- Location (optional) -->
            <div
              *ngIf="terminalForm.get('type')?.value === TerminalType.PHYSICAL"
            >
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Location (Optional)</label
              >
              <div class="flex space-x-2">
                <input
                  type="text"
                  formControlName="latitude"
                  class="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Latitude"
                />
                <input
                  type="text"
                  formControlName="longitude"
                  class="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Longitude"
                />
              </div>
              <p class="mt-1 text-xs text-gray-500">
                You can use the current location or enter coordinates manually
              </p>
              <button
                type="button"
                (click)="getCurrentLocation()"
                class="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <i class="material-icons text-sm mr-1">my_location</i>
                Use Current Location
              </button>
            </div>
          </div>

          <!-- Form actions -->
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              (click)="cancelCreate()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="terminalForm.invalid || isSubmitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span *ngIf="!isSubmitting">Create Terminal</span>
              <span *ngIf="isSubmitting" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Terminal Preview Modal -->
      <div
        *ngIf="selectedTerminal"
        class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
          <!-- Reduced from max-w-2xl -->
          <div class="p-4 border-b flex justify-between items-center">
            <!-- Reduced padding from p-5 to p-4 -->
            <h3 class="text-base font-medium text-gray-900">
              Terminal Details
            </h3>
            <!-- Reduced from text-lg to text-base -->
            <button
              (click)="closeTerminalDetails()"
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <i class="material-icons">close</i>
            </button>
          </div>

          <div class="p-4">
            <!-- Reduced padding from p-5 to p-4 -->
            <div class="flex flex-col md:flex-row gap-4">
              <!-- Reduced gap from gap-6 to gap-4 -->
              <!-- QR Code - make it smaller -->
              <div class="flex flex-col items-center">
                <div class="bg-white p-2 border rounded-lg">
                  <img
                    [src]="selectedTerminalQR"
                    class="w-32 h-32"
                    alt="Terminal QR Code"
                  />
                  <!-- Reduced from w-48 h-48 -->
                </div>
                <button
                  (click)="downloadQRCode()"
                  class="mt-2 flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <!-- Reduced size of button -->
                  <i class="material-icons text-xs mr-1">download</i>
                  Download QR
                </button>
              </div>

              <!-- Terminal Info -->
              <div class="flex-1">
                <div class="space-y-2">
                  <div>
                    <h4 class="text-sm font-medium text-gray-500">
                      Terminal ID
                    </h4>
                    <p class="mt-1 text-sm text-gray-900">
                      {{ selectedTerminal.terminalId }}
                    </p>
                  </div>

                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Name</h4>
                    <p class="mt-1 text-sm text-gray-900">
                      {{ selectedTerminal.name }}
                    </p>
                  </div>

                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Type</h4>
                    <p class="mt-1 text-sm text-gray-900">
                      {{ selectedTerminal.type }}
                    </p>
                  </div>

                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Status</h4>
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      [class.bg-green-100]="
                        selectedTerminal.status === 'ACTIVE'
                      "
                      [class.text-green-800]="
                        selectedTerminal.status === 'ACTIVE'
                      "
                      [class.bg-red-100]="
                        selectedTerminal.status === 'DISABLED'
                      "
                      [class.text-red-800]="
                        selectedTerminal.status === 'DISABLED'
                      "
                      [class.bg-yellow-100]="
                        selectedTerminal.status === 'SUSPENDED'
                      "
                      [class.text-yellow-800]="
                        selectedTerminal.status === 'SUSPENDED'
                      "
                    >
                      {{ selectedTerminal.status }}
                    </span>
                  </div>

                  <div *ngIf="selectedTerminal.description">
                    <h4 class="text-sm font-medium text-gray-500">
                      Description
                    </h4>
                    <p class="mt-1 text-sm text-gray-900">
                      {{ selectedTerminal.description }}
                    </p>
                  </div>

                  <div>
                    <h4 class="text-sm font-medium text-gray-500">Created</h4>
                    <p class="mt-1 text-sm text-gray-900">
                      {{ selectedTerminal.createdAt | date : 'medium' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Status Actions -->
            <div class="flex justify-end mt-5 space-x-3">
              <button
                *ngIf="selectedTerminal.status !== TerminalStatus.ACTIVE"
                (click)="
                  updateTerminalStatus(
                    selectedTerminal.terminalId,
                    TerminalStatus.ACTIVE
                  )
                "
                [disabled]="isStatusUpdating"
                class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <span *ngIf="!isStatusUpdating">Activate</span>
                <span *ngIf="isStatusUpdating" class="flex items-center">
                  <i class="material-icons animate-spin text-xs mr-1"
                    >refresh</i
                  >
                  Updating...
                </span>
              </button>
              <button
                *ngIf="selectedTerminal.status !== TerminalStatus.DISABLED"
                (click)="
                  updateTerminalStatus(
                    selectedTerminal.terminalId,
                    TerminalStatus.DISABLED
                  )
                "
                [disabled]="isStatusUpdating"
                class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <span *ngIf="!isStatusUpdating">Disable</span>
                <span *ngIf="isStatusUpdating" class="flex items-center">
                  <i class="material-icons animate-spin text-xs mr-1"
                    >refresh</i
                  >
                  Updating...
                </span>
              </button>
              <button
                *ngIf="selectedTerminal.status !== TerminalStatus.SUSPENDED"
                (click)="
                  updateTerminalStatus(
                    selectedTerminal.terminalId,
                    TerminalStatus.SUSPENDED
                  )
                "
                [disabled]="isStatusUpdating"
                class="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <span *ngIf="!isStatusUpdating">Suspend</span>
                <span *ngIf="isStatusUpdating" class="flex items-center">
                  <i class="material-icons animate-spin text-xs mr-1"
                    >refresh</i
                  >
                  Updating...
                </span>
              </button>
            </div>
          </div>

          <!-- Terminal Payment History -->
          <div class="p-5 bg-gray-50 border-t">
            <h3 class="text-md font-medium text-gray-900 mb-3">
              Recent Payments
            </h3>

            <div *ngIf="loadingPaymentLinks" class="flex justify-center py-4">
              <div
                class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"
              ></div>
            </div>

            <div
              *ngIf="terminalPaymentLinks.length === 0 && !loadingPaymentLinks"
              class="text-center py-4 text-gray-500"
            >
              No payment links found for this terminal
            </div>

            <div
              *ngIf="terminalPaymentLinks.length > 0"
              class="overflow-x-auto"
            >
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let link of terminalPaymentLinks">
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                    >
                      {{ link.linkId }}
                    </td>
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {{ link.createdAt | date : 'MMM d, yyyy, h:mm a' }}
                    </td>
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {{ formatCurrency(link.amount, link.currency) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="px-2 py-1 text-xs font-medium rounded-full"
                        [class.bg-green-100]="link.status === 'PAID'"
                        [class.text-green-800]="link.status === 'PAID'"
                        [class.bg-yellow-100]="link.status === 'PENDING'"
                        [class.text-yellow-800]="link.status === 'PENDING'"
                        [class.bg-red-100]="
                          link.status === 'EXPIRED' ||
                          link.status === 'CANCELLED'
                        "
                        [class.text-red-800]="
                          link.status === 'EXPIRED' ||
                          link.status === 'CANCELLED'
                        "
                      >
                        {{ link.status }}
                      </span>
                    </td>
                    <td
                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {{ link.customerName || 'Anonymous' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Terminals List -->
      <div
        *ngIf="!loading && !error && terminals.length === 0"
        class="bg-white p-8 rounded-lg shadow-sm text-center"
      >
        <i class="material-icons text-4xl text-gray-400 mb-2">point_of_sale</i>
        <h2 class="text-xl font-medium text-gray-600 mb-2">
          No Terminals Found
        </h2>
        <p class="text-gray-500 mb-4">
          You haven't created any payment terminals yet.
        </p>
        <button
          (click)="showCreateForm()"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <i class="material-icons text-sm mr-1">add</i>
          Create Your First Terminal
        </button>
      </div>

      <div
        *ngIf="!loading && terminals.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          *ngFor="let terminal of terminals"
          class="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <div class="p-4 border-b flex justify-between items-center">
            <div>
              <h3 class="font-medium text-gray-900">{{ terminal.name }}</h3>
              <p class="text-sm text-gray-500">{{ terminal.terminalId }}</p>
            </div>
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              [class.bg-green-100]="terminal.status === 'ACTIVE'"
              [class.text-green-800]="terminal.status === 'ACTIVE'"
              [class.bg-red-100]="terminal.status === 'DISABLED'"
              [class.text-red-800]="terminal.status === 'DISABLED'"
              [class.bg-yellow-100]="terminal.status === 'SUSPENDED'"
              [class.text-yellow-800]="terminal.status === 'SUSPENDED'"
            >
              {{ terminal.status }}
            </span>
          </div>

          <div class="p-4 flex justify-between items-center">
            <div>
              <p class="text-xs text-gray-500">Type: {{ terminal.type }}</p>
              <p class="text-xs text-gray-500">
                Created: {{ terminal.createdAt | date : 'shortDate' }}
              </p>
            </div>
            <button
              (click)="viewTerminalDetails(terminal.terminalId)"
              class="px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 hover:bg-gray-50"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./payment-terminals.component.scss'],
})
export class PaymentTerminalsComponent implements OnInit {
  TerminalType = TerminalType;
  TerminalStatus = TerminalStatus;

  terminals: Terminal[] = [];
  loading = false;
  error = '';
  successMessage = '';

  showForm = false;
  terminalForm: FormGroup;
  isSubmitting = false;

  selectedTerminal: Terminal | null = null;
  selectedTerminalQR: string = '';
  isStatusUpdating = false;

  terminalPaymentLinks: PaymentLink[] = [];
  loadingPaymentLinks = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private store: Store
  ) {
    this.terminalForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      type: [TerminalType.PHYSICAL],
      defaultAmount: [null],
      defaultCurrency: ['GHS'],
      defaultExpiryMinutes: [15],
      latitude: [''],
      longitude: [''],
    });
  }

  ngOnInit(): void {
    this.loadTerminals();
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadTerminals(): void {
    this.loading = true;
    const merchantId = this.store.selectSnapshot(
      (state) => state.auth.user?.merchantId?._id
    );

    if (!merchantId) {
      this.error = 'Merchant ID not found';
      this.loading = false;
      return;
    }

    this.http
      .get<any>(`https://doronpay.com/api/terminals/merchant/${merchantId}`, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.terminals = response.data;
          } else {
            this.error = response.message || 'Failed to load terminals';
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error loading terminals';
          this.loading = false;
          console.error('Terminal fetch error:', err);
        },
      });
  }

  showCreateForm(): void {
    this.showForm = true;
    this.terminalForm.reset({
      type: TerminalType.PHYSICAL,
      defaultCurrency: 'GHS',
      defaultExpiryMinutes: 15,
    });
  }

  cancelCreate(): void {
    this.showForm = false;
  }

  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.terminalForm.patchValue({
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          this.error = 'Failed to get current location';
        }
      );
    } else {
      this.error = 'Geolocation is not supported by this browser';
    }
  }

  createTerminal(): void {
    if (this.terminalForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const merchantId = this.store.selectSnapshot(
      (state) => state.auth.user?.merchantId?._id
    );

    if (!merchantId) {
      this.error = 'Merchant ID not found';
      this.isSubmitting = false;
      return;
    }

    const formValue = this.terminalForm.value;

    // Prepare location data if provided
    let location = undefined;
    if (formValue.latitude && formValue.longitude) {
      location = {
        type: 'Point',
        coordinates: [
          parseFloat(formValue.longitude),
          parseFloat(formValue.latitude),
        ],
      };
    }

    const terminalData = {
      merchantId,
      name: formValue.name,
      description: formValue.description,
      type: formValue.type,
      location,
      defaultAmount: formValue.defaultAmount,
      defaultCurrency: formValue.defaultCurrency,
      defaultExpiryMinutes: formValue.defaultExpiryMinutes,
    };

    this.http
      .post<any>('https://doronpay.com/api/terminals/create', terminalData, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Terminal created successfully';
            this.showForm = false;
            this.loadTerminals();

            // Auto-clear success message after 3 seconds
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.error = response.message || 'Failed to create terminal';
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          this.error = 'Error creating terminal';
          this.isSubmitting = false;
          console.error('Terminal creation error:', err);
        },
      });
  }

  viewTerminalDetails(terminalId: string): void {
    this.http
      .get<any>(`https://doronpay.com/api/terminals/${terminalId}`, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedTerminal = response.data.terminal;
            this.selectedTerminalQR = response.data.qrCode;
            this.loadTerminalPaymentLinks(terminalId);
          } else {
            this.error = response.message || 'Failed to load terminal details';
          }
        },
        error: (err) => {
          this.error = 'Error loading terminal details';
          console.error('Terminal details error:', err);
        },
      });
  }

  closeTerminalDetails(): void {
    this.selectedTerminal = null;
    this.selectedTerminalQR = '';
    this.terminalPaymentLinks = [];
  }

  downloadQRCode(): void {
    if (!this.selectedTerminalQR) return;

    const link = document.createElement('a');
    link.href = this.selectedTerminalQR;
    link.download = `terminal-${this.selectedTerminal?.terminalId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  updateTerminalStatus(terminalId: string, status: TerminalStatus): void {
    this.isStatusUpdating = true;

    this.http
      .patch<any>(
        `https://doronpay.com/api/terminals/${terminalId}/status`,
        { status },
        {
          headers: this.getHeaders(),
        }
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = `Terminal status updated to ${status}`;

            // Update the selected terminal status
            if (this.selectedTerminal) {
              this.selectedTerminal.status = status;
            }

            // Update the status in the terminals list
            const terminalIndex = this.terminals.findIndex(
              (t) => t._id === terminalId
            );
            if (terminalIndex !== -1) {
              this.terminals[terminalIndex].status = status;
            }

            // Auto-clear success message
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.error = response.message || 'Failed to update terminal status';
          }
          this.isStatusUpdating = false;
        },
        error: (err) => {
          this.error = 'Error updating terminal status';
          this.isStatusUpdating = false;
          console.error('Terminal status update error:', err);
        },
      });
  }

  loadTerminalPaymentLinks(terminalId: string): void {
    this.loadingPaymentLinks = true;
    this.terminalPaymentLinks = [];

    this.http
      .get<any>(
        `https://doronpay.com/api/terminals/${terminalId}/payment-links`,
        {
          headers: this.getHeaders(),
        }
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.terminalPaymentLinks = response.data;
          } else {
            console.error('Failed to load payment links:', response.message);
          }
          this.loadingPaymentLinks = false;
        },
        error: (err) => {
          console.error('Payment links fetch error:', err);
          this.loadingPaymentLinks = false;
        },
      });
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
