import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

interface Permission {
  _id?: string;
  name: string;
  scope: 'admin' | 'merchant';
  createdAt?: Date;
}

interface PaginatedResponse {
  success: boolean;
  data: Permission[];
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

@Component({
  selector: 'app-permission-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './permission-management.component.html',
  styleUrls: ['./permission-management.component.css']
})
export class PermissionManagementComponent implements OnInit, OnDestroy {
  permissions: Permission[] = []; // Current page of permissions
  allPermissions: Permission[] = []; // All permissions from the API
  loading = true;
  error: string | null = null;
  isAddModalOpen = false;
  isDeleteModalOpen = false;
  selectedPermission: Permission | null = null;

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Predefined permission names from backend enum
  permissionNames = [
    // 'can approve payroll'
    // Your existing permissions list...
  ];

  // Forms
  addForm: FormGroup;
  deleteForm: FormGroup;
  
  // Token subscription
  private tokenSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private store: Store
  ) {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      scope: ['admin', Validators.required] // Default to 'admin' as per backend schema
    });

    this.deleteForm = this.fb.group({
      id: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPermissions();
    
    // Subscribe to token changes to reload data when token refreshes
    this.tokenSubscription = this.store.select(AuthState.token).subscribe(() => {
      this.loadPermissions();
    });
  }
  
  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadPermissions(): void {
    this.loading = true;
    
    // Since backend doesn't support pagination, just get all data
    this.http.get<PaginatedResponse>(
      'https://doronpay.com/api/merchants/permissions/get',
      { headers: this.getHeaders() }
    ).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        if (response.success) {
          this.allPermissions = response.data;
          this.totalItems = this.allPermissions.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          
          // Apply client-side pagination
          this.applyPagination();
          
          // console.log(`Received ${this.permissions.length} items of ${this.totalItems} total`);
        } else {
          this.error = 'Failed to load permissions';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('API Error:', error);
        this.error = 'Failed to load permissions';
        this.loading = false;
      }
    });
  }

  // Apply client-side pagination to the data
  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.allPermissions.length);
    
    this.permissions = this.allPermissions.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.applyPagination();
  }

  changePage(delta: number): void {
    this.goToPage(this.currentPage + delta);
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select && select.value) {
      this.changePageSize(parseInt(select.value, 10));
    }
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1; // Reset to first page when changing page size
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.applyPagination();
  }

  minValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  openAddModal(): void {
    this.addForm.reset({
      scope: 'admin' // Reset to default value
    });
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
  }

  openDeleteModal(permission: Permission): void {
    this.selectedPermission = permission;
    this.deleteForm.patchValue({ id: permission._id });
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedPermission = null;
  }

  onSubmitAdd(): void {
    if (this.addForm.invalid) {
      return;
    }

    const formValue = this.addForm.value;
    const permissionData = {
      name: formValue.name,
      scope: formValue.scope
    };

    this.http.post(
      'https://doronpay.com/api/merchants/permissions/add',
      permissionData,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.loadPermissions(); // Reload all permissions
        this.closeAddModal();
      },
      error: (error) => {
        this.error = 'Failed to add permission';
        console.error(error);
      }
    });
  }

  onSubmitDelete(): void {
    if (this.deleteForm.invalid || !this.selectedPermission) {
      return;
    }

    this.http.delete(
      'https://doronpay.com/api/merchants/permissions/delete', 
      { 
        body: { id: this.selectedPermission._id },
        headers: this.getHeaders()
      }
    ).subscribe({
      next: () => {
        this.loadPermissions(); // Reload all permissions
        this.closeDeleteModal();
      },
      error: (error) => {
        this.error = 'Failed to delete permission';
        console.error(error);
      }
    });
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max pages to show
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end page numbers
      let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      
      // Adjust if end page is beyond total pages
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      // Add page numbers
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}