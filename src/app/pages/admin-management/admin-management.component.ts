import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Admin, AdminService } from '../../service/admin.service';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Enum to match backend authorization roles
enum EAuthorizers {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Admin',
  INITIATOR = 'Initiator',
  APPROVER = 'Approver'
}

interface DialogData {
  title: string;
  message: string;
  confirmButtonText: string;
  confirmButtonClass: string;
  action: string;
  admin?: Admin;
}

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatMenuModule,
  ],
  templateUrl: './admin-management.component.html',
  styleUrls: ['./admin-management.component.css']
})
export class AdminManagementComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  Math = Math;
  displayedColumns: string[] = ['name', 'email', 'phone', 'permissions', 'last_seen', 'created_at', 'status', 'actions'];
  dataSource = new MatTableDataSource<Admin>([]);
  adminForm!: FormGroup;
  admins: Admin[] = [];
  isLoading = false;
  showForm = false;
  editingAdmin: Admin | null = null;
  hidePassword = true;
  searchValue: string = '';
  
  // For confirmation dialogs
  showConfirmation = false;
  dialogData: DialogData = {
    title: '',
    message: '',
    confirmButtonText: '',
    confirmButtonClass: '',
    action: ''
  };
  
  // Currently selected admin for action
  selectedAdmin: Admin | null = null;
  
  // Add available permissions
  availablePermissions = [
    { value: EAuthorizers.SUPER_ADMIN, label: 'Super Admin' },
    { value: EAuthorizers.ADMIN, label: 'Admin' },
    { value: EAuthorizers.INITIATOR, label: 'Initiator' },
    { value: EAuthorizers.APPROVER, label: 'Approver' },
    { value: 'manage_password', label: 'Manage Password' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm(admin?: Admin) {
    this.adminForm = this.fb.group({
      email: [admin?.email || '', [Validators.required, Validators.email]],
      password: [!admin ? '' : null, !admin ? Validators.required : null],
      name: [admin?.name || '', Validators.required],
      phone: [admin?.phone || '', Validators.required],
      permissions: [admin?.permissions || [EAuthorizers.ADMIN], Validators.required],
      blocked: [admin?.blocked || false],
      merchantId: [admin?.merchantId || '', Validators.required]
    });
  }

  ngOnInit() {
    this.setupDataSourceFiltering();
    this.loadAdmins();
  }

  ngAfterViewInit() {
    // Will be called after the view is initialized
    if (this.paginator && this.sort) {
      this.connectPaginatorAndSort();
    }
  }

  private setupDataSourceFiltering() {
    // Custom filter predicate for case-insensitive search across multiple fields
    this.dataSource.filterPredicate = (data: Admin, filter: string) => {
      const searchTerm = filter.toLowerCase().trim();
      
      // Search in multiple fields
      return (
        (data.name || '').toLowerCase().includes(searchTerm) ||
        (data.email || '').toLowerCase().includes(searchTerm) ||
        (data.phone || '').toLowerCase().includes(searchTerm) ||
        (data.permissions || []).some(p => p.toLowerCase().includes(searchTerm))
      );
    };
  }

  private connectPaginatorAndSort() {
    // Connect the paginator and sort to the data source
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadAdmins() {
    this.isLoading = true;
    this.adminService.getAdmins().subscribe({
      next: (response) => {
        if (response.success) {
          this.admins = response.data;
          this.dataSource.data = this.admins;
          
          // Re-connect paginator and sort after data is loaded
          setTimeout(() => this.connectPaginatorAndSort());
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchValue = filterValue;
    
    // Apply the filter to the data source
    this.dataSource.filter = filterValue.trim().toLowerCase();

    // When filtering, return to first page
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch() {
    this.searchValue = '';
    this.dataSource.filter = '';
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSubmit() {
    if (this.adminForm.invalid) return;

    this.isLoading = true;
    const adminData = this.adminForm.value;

    if (this.editingAdmin) {
      this.adminService.updateAdmin({ id: this.editingAdmin._id!, data: adminData }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAdmins();
            this.showForm = false;
            this.resetForm();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating admin:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.adminService.addAdmin(adminData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAdmins();
            this.showForm = false;
            this.resetForm();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error adding admin:', error);
          this.isLoading = false;
        }
      });
    }
  }

  openAdminModal() {
    this.resetForm();
    this.showForm = true;
  }

  editAdmin(admin: Admin) {
    this.editingAdmin = admin;
    this.initializeForm(admin);
    this.showForm = true;
  }

  openDeleteDialog(admin: Admin) {
    this.selectedAdmin = admin;
    this.dialogData = {
      title: 'Delete Admin',
      message: `Are you sure you want to delete ${admin.name}? This action cannot be undone.`,
      confirmButtonText: 'Delete',
      confirmButtonClass: 'btn-danger',
      action: 'delete'
    };
    this.showConfirmation = true;
  }

  openBlockDialog(admin: Admin) {
    this.selectedAdmin = admin;
    const action = admin.blocked ? 'unblock' : 'block';
    
    this.dialogData = {
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Admin`,
      message: `Are you sure you want to ${action} ${admin.name}?`,
      confirmButtonText: action.charAt(0).toUpperCase() + action.slice(1),
      confirmButtonClass: 'btn-warning',
      action: 'block'
    };
    this.showConfirmation = true;
  }

  confirmAction() {
    if (!this.selectedAdmin) return;
    
    if (this.dialogData.action === 'delete') {
      this.deleteAdmin(this.selectedAdmin);
    } else if (this.dialogData.action === 'block') {
      this.toggleBlockStatus(this.selectedAdmin);
    }
    
    this.closeConfirmationDialog();
  }

  closeConfirmationDialog() {
    this.showConfirmation = false;
    this.selectedAdmin = null;
  }

  deleteAdmin(admin: Admin) {
    this.isLoading = true;
    this.adminService.deleteAdmin(admin._id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadAdmins();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting admin:', error);
        this.isLoading = false;
      }
    });
  }

  toggleBlockStatus(admin: Admin) {
    const updatedData = {
      ...admin,
      blocked: !admin.blocked
    };

    this.adminService.updateAdmin({ id: admin._id!, data: updatedData }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadAdmins();
        }
      },
      error: (error) => console.error(`Error ${admin.blocked ? 'unblocking' : 'blocking'} admin:`, error)
    });
  }

  resetForm() {
    this.editingAdmin = null;
    this.initializeForm();
    this.hidePassword = true;
  }

  // Helper method to check if a permission is selected
  hasPermission(admin: Admin, permission: string): boolean {
    return admin.permissions?.includes(permission) || false;
  }

  // Helper method to get badge class for a permission
  getPermissionBadgeClass(permission: string): string {
    switch(permission) {
      case EAuthorizers.SUPER_ADMIN:
        return 'badge-super-admin';
      case EAuthorizers.ADMIN:
        return 'badge-admin';
      case EAuthorizers.INITIATOR:
        return 'badge-initiator';
      case EAuthorizers.APPROVER:
        return 'badge-approver';
      case 'manage_password':
        return 'badge-password';
      default:
        return 'badge-secondary';
    }
  }
}