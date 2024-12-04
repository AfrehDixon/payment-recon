import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import API from '../../constants/api.constant';

interface MerchantDetails {
  _id: string;
  operations: string[];
  debitOperator: string;
  creditOperator: string;
  address: string;
  submitted: boolean;
  type: string;
  active: boolean;
  email: string;
  lineOfBusiness: string;
  location: string;
  merchant_tradeName: string;
  phone: string;
  registrationNumber: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  contact_person: string;
  approvedDate: string;
  can_onboard_merchants: boolean;
  debitCardOperator: string;
  autosettle: boolean;
  chargeType: string;
  accountType: string;
  // Charges
  disburse_gip_cap: number;
  disburse_gip_charge: number;
  disburse_min_cap: number;
  disburse_momo_cap: number;
  disburse_momo_charge: number;
  disburse_nrt_charge: number;
  momo_cap: number;
  momo_charge: number;
  momo_min_charge: number;
  btc_charge: number;
  card_charge: number;
  createdAt: string;
  updatedAt: string;
}

interface MerchantDocument {
  _id: string;
  id: string;
  path: string;
  name: string;
  data: string; // base64 image data
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-merchant-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="merchant-details-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Merchant Details</h1>
          <button class="back-btn" (click)="goBack()">
            <i class="fas fa-arrow-left"></i> Back to Merchants
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <div class="modal" *ngIf="showDocumentModal">
        <div class="modal-overlay" (click)="closeDocumentModal()"></div>
        <div class="modal-content document-modal">
          <div class="modal-header">
            <h2 class="modal-title">Document View</h2>
            <button class="close-btn" (click)="closeDocumentModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <img
              [src]="selectedDocument"
              class="document-image"
              alt="Document"
            />
          </div>
        </div>
      </div>

      <!-- Merchant Information -->
      <div *ngIf="merchantDetails && !isLoading" class="content-grid">
        <!-- Basic Information -->
        <div class="info-card">
          <h2 class="card-title">Basic Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Trade Name</label>
              <span>{{ merchantDetails.merchant_tradeName }}</span>
            </div>
            <div class="info-item">
              <label>Registration Number</label>
              <span>{{ merchantDetails.registrationNumber }}</span>
            </div>
            <div class="info-item">
              <label>Line of Business</label>
              <span>{{ merchantDetails.lineOfBusiness }}</span>
            </div>
            <div class="info-item">
              <label>Address</label>
              <span>{{ merchantDetails.address }}</span>
            </div>
            <div class="info-item">
              <label>Location</label>
              <span>{{ merchantDetails.location }}</span>
            </div>
            <div class="info-item">
              <label>Status</label>
              <span
                class="status-badge"
                [class.active]="merchantDetails.active"
              >
                {{ merchantDetails.active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="info-card">
          <h2 class="card-title">Contact Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Email</label>
              <span>{{ merchantDetails.email }}</span>
            </div>
            <div class="info-item">
              <label>Phone</label>
              <span>{{ merchantDetails.phone }}</span>
            </div>
            <div class="info-item">
              <label>Contact Person</label>
              <span>{{ merchantDetails.contact_person }}</span>
            </div>
            <div class="info-item">
              <label>Contact Person Role</label>
              <span>{{ merchantDetails.contactPersonDesignation }}</span>
            </div>
            <div class="info-item">
              <label>Contact Person Email</label>
              <span>{{ merchantDetails.contactPersonEmail }}</span>
            </div>
            <div class="info-item">
              <label>Contact Person Phone</label>
              <span>{{ merchantDetails.contactPersonPhone }}</span>
            </div>
          </div>
        </div>

        <!-- Operations & Settings -->
        <div class="info-card">
          <h2 class="card-title">Operations & Settings</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Account Type</label>
              <span>{{ merchantDetails.accountType }}</span>
            </div>
            <div class="info-item">
              <label>Merchant Type</label>
              <span>{{ merchantDetails.type }}</span>
            </div>
            <div class="info-item">
              <label>Operations</label>
              <span class="operations-list">
                <span
                  class="operation-badge"
                  *ngFor="let op of merchantDetails.operations"
                >
                  {{ op }}
                </span>
              </span>
            </div>
            <div class="info-item">
              <label>Auto Settle</label>
              <span>{{ merchantDetails.autosettle ? 'Yes' : 'No' }}</span>
            </div>
            <div class="info-item">
              <label>Debit Operator</label>
              <span>{{ merchantDetails.debitOperator }}</span>
            </div>
            <div class="info-item">
              <label>Credit Operator</label>
              <span>{{ merchantDetails.creditOperator }}</span>
            </div>
          </div>
        </div>

        <!-- Charges Information -->
        <div class="info-card">
          <h2 class="card-title">Charges Configuration</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Charge Type</label>
              <span>{{ merchantDetails.chargeType }}</span>
            </div>
            <div class="info-item">
              <label>GIP Charge</label>
              <span>{{ merchantDetails.disburse_gip_charge }}%</span>
            </div>
            <div class="info-item">
              <label>GIP Cap</label>
              <span>{{ merchantDetails.disburse_gip_cap }}</span>
            </div>
            <div class="info-item">
              <label>MoMo Charge</label>
              <span>{{ merchantDetails.momo_charge }}%</span>
            </div>
            <div class="info-item">
              <label>MoMo Cap</label>
              <span>{{ merchantDetails.momo_cap }}</span>
            </div>
            <div class="info-item">
              <label>Card Charge</label>
              <span>{{ merchantDetails.card_charge }}%</span>
            </div>
          </div>
        </div>

        <!-- Documents Section -->
        <div class="info-card documents-section">
          <h2 class="card-title">Documents</h2>
          <div class="documents-grid">
            <div *ngFor="let doc of documents" class="document-item">
              <div class="document-info">
                <span class="document-type">{{ doc.path }}</span>
                <span class="document-name">{{ doc.name }}</span>
              </div>
              <button class="view-btn" (click)="viewDocument(doc.data)">
                View Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .merchant-details-container {
        padding: 24px;
        background-color: #f8f9fa;
        min-height: 100vh;
        margin-left: 200px;
      }

      .header-section {
        margin-bottom: 32px;
      }

      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
      }

      .modal-content.document-modal {
        position: relative;
        background: white;
        border-radius: 8px;
        max-width: 90vw;
        max-height: 90vh;
        width: auto;
        height: auto;
        z-index: 1001;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #374151;
        margin: 0;
      }

      .close-btn {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #6b7280;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .close-btn:hover {
        color: #1f2937;
      }

      .modal-body {
        padding: 16px;
        overflow: auto;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .document-image {
        max-width: 100%;
        max-height: calc(90vh - 100px);
        object-fit: contain;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
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

      .content-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
      }

      .info-card {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 16px 0;
      }

      .info-grid {
        display: grid;
        gap: 16px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .info-item label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }

      .info-item span {
        font-size: 15px;
        color: #1f2937;
      }

      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
      }

      .status-badge.active {
        background-color: #d1fae5;
        color: #065f46;
      }

      .status-badge:not(.active) {
        background-color: #fee2e2;
        color: #991b1b;
      }

      .operations-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .operation-badge {
        background-color: #e5e7eb;
        color: #374151;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 13px;
      }

      .documents-section {
        grid-column: 1 / -1;
      }

      .documents-grid {
        display: grid;
        gap: 16px;
      }

      .document-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background-color: #f9fafb;
        border-radius: 6px;
      }

      .document-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .document-type {
        font-size: 15px;
        font-weight: 500;
        color: #374151;
      }

      .document-name {
        font-size: 14px;
        color: #6b7280;
      }

      .view-btn {
        padding: 6px 12px;
        background-color: #3b82f6;
        color: white;
        border-radius: 4px;
        font-size: 14px;
        text-decoration: none;
        transition: all 0.2s;
      }

      .view-btn:hover {
        background-color: #2563eb;
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
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-message {
        background-color: #fee2e2;
        color: #991b1b;
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 16px;
      }
    `,
  ],
})
export class MerchantDetailsComponent implements OnInit {
  merchantDetails: MerchantDetails | null = null;
  documents: MerchantDocument[] = [];
  isLoading = false;
  error: string | null = null;
  merchantId: string | null = null;
  showDocumentModal = false;
  selectedDocument: string | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.merchantId = this.route.snapshot.paramMap.get('id');
    if (this.merchantId) {
      this.loadMerchantData();
    }
  }

  viewDocument(base64Data: string): void {
    this.selectedDocument = base64Data;
    this.showDocumentModal = true;
  }

  closeDocumentModal(): void {
    this.showDocumentModal = false;
    this.selectedDocument = null;
  }

  loadMerchantData(): void {
    if (!this.merchantId) return;

    this.isLoading = true;
    this.error = null;

    forkJoin({
      details: this.http.get<{
        success: boolean;
        message: string;
        data: MerchantDetails;
      }>(`${API}/merchants/get/${this.merchantId}`),
      documents: this.http.get<{
        success: boolean;
        message: string;
        data: MerchantDocument[];
      }>(`${API}/documents/get/${this.merchantId}`),
    })
      .pipe(
        catchError((error) => {
          console.error('Error:', error);
          this.error = 'Failed to load merchant information';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((response) => {
        if (response) {
          if (response.details?.success) {
            this.merchantDetails = response.details.data;
          }
          if (response.documents?.success) {
            this.documents = response.documents.data;
          }
        }
      });
  }

  goBack(): void {
    window.history.back();
  }

  //   viewDocument(base64Data: string): void {
  //     // Open image in new window
  //     const newWindow = window.open();
  //     if (newWindow) {
  //       newWindow.document.write(`
  //         <html>
  //           <head>
  //             <title>Document View</title>
  //           </head>
  //           <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
  //             <img src="${base64Data}" style="max-width:100%;max-height:100vh;object-fit:contain;">
  //           </body>
  //         </html>
  //       `);
  //     }
  //   }
}
