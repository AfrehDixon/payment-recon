import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Admin,
  AdminService,
  Merchant,
  Permission,
} from '../../service/admin.service';
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
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { PermissionService } from '../../service/permissions.service';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';

interface DialogData {
  title: string;
  message: string;
  confirmButtonText: string;
  confirmButtonClass: string;
  action: string;
  admin?: Admin;
}

interface PermissionCategory {
  id: string;
  name: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
  styleUrls: ['./admin-management.component.css'],
})
export class AdminManagementComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  Math = Math;
  displayedColumns: string[] = [
    'name',
    'email',
    'phone',
    'permissions',
    'last_seen',
    'created_at',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<Admin>([]);
  adminForm!: FormGroup;
  // Component properties
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
    action: '',
  };

  // Currently selected admin for action
  selectedAdmin: Admin | null = null;

  // Available permissions and merchants from the backend
  availablePermissions: Permission[] = [];
  availableMerchants: Merchant[] = [];

  // New properties for improved UI
  expandedPermissions: { [key: string]: boolean } = {};
  permissionSearchQuery: string = '';
  activePermissionTab: string = 'all';

  // Permission categories
  permissionCategories: PermissionCategory[] = [
    { id: 'all', name: 'All', permissions: [] },
    { id: 'admin', name: 'Admin', permissions: [] },
    { id: 'merchant', name: 'Merchant', permissions: [] },
    { id: 'account', name: 'Account', permissions: [] },
    { id: 'system', name: 'System', permissions: [] },
    { id: 'view', name: 'View Access', permissions: [] },
    { id: 'edit', name: 'Edit Access', permissions: [] },
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private permissionService: PermissionService,
    private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient, 
    private store: Store
  ) {
    this.initializeForm();
  }

  private initializeForm(admin?: Admin) {
    // Create the form with required validators, ensuring permissions is an array
    const formGroup: FormGroup = this.fb.group({
      email: [admin?.email || '', [Validators.required, Validators.email]],
      name: [admin?.name || '', Validators.required],
      phone: [admin?.phone || '', Validators.required],
      // Ensure permissions is initialized as an array
      permissions: [admin?.permissions || [], Validators.required],
      merchantId: [admin?.merchantId || '', Validators.required],
    });

    // Only add password field for new admins, not when editing
    if (!admin) {
      formGroup.addControl(
        'password',
        this.fb.control('', Validators.required)
      );
    }

    this.adminForm = formGroup;
  }

  ngOnInit() {
    this.permissionService.getPermissions().subscribe(() => {
      // Now that permissions are loaded, trigger change detection
      this.changeDetectorRef.detectChanges();
    });
    this.setupDataSourceFiltering();
    this.loadInitialData();
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
        (data.permissions || []).some((p) =>
          this.findPermissionName(p).toLowerCase().includes(searchTerm)
        )
      );
    };
  }

  private connectPaginatorAndSort() {
    // Connect the paginator and sort to the data source
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

    private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadInitialData() {
    this.isLoading = true;

    // Use forkJoin to make parallel requests for admins, permissions, and merchants
    forkJoin({
      admins: this.loadAdminsDirectly(),
      permissions: this.loadPermissionsDirectly(),
      merchants: this.loadMerchantsDirectly(),
    }).subscribe({
      next: (results) => {
        if (results.admins.success) {
          this.admins = results.admins.data;
          this.dataSource.data = this.admins;

          // Re-connect paginator and sort after data is loaded
          setTimeout(() => this.connectPaginatorAndSort());
        }

        if (results.permissions.success) {
          this.availablePermissions = results.permissions.data;
          this.categorizePermissions();
        }

        if (results.merchants.success) {
          this.availableMerchants = results.merchants.data;
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading initial data:', error);
        this.isLoading = false;
      },
    });
  }

  // Group permissions into categories
  categorizePermissions() {
    // Reset categories first
    this.permissionCategories.forEach((category) => {
      category.permissions = [];
    });

    // All permissions category
    this.permissionCategories[0].permissions = [...this.availablePermissions];

    // Categorize by scope
    this.availablePermissions.forEach((permission) => {
      // Add to scope-based categories (admin, merchant)
      if (permission.scope) {
        const scopeCategory = this.permissionCategories.find(
          (c) => c.id === permission.scope
        );
        if (scopeCategory) {
          scopeCategory.permissions.push(permission);
        }
      }

      // Add to functional categories (view, edit, account, system)
      if (permission.name.includes('view')) {
        this.permissionCategories
          .find((c) => c.id === 'view')
          ?.permissions.push(permission);
      } else if (permission.name.includes('edit')) {
        this.permissionCategories
          .find((c) => c.id === 'edit')
          ?.permissions.push(permission);
      }

      if (permission.name.includes('account')) {
        this.permissionCategories
          .find((c) => c.id === 'account')
          ?.permissions.push(permission);
      } else if (permission.name.includes('system')) {
        this.permissionCategories
          .find((c) => c.id === 'system')
          ?.permissions.push(permission);
      }
    });
  }

 private loadAdminsDirectly(): Observable<any> {
    return this.http.get<any>('https://doronpay.com/api/admin/get', {
      headers: this.getHeaders()
    }).pipe(
      catchError((err) => {
        console.error('Error loading admins:', err);
        return of({ success: false, data: [] });
      })
    );
  }

  private loadPermissionsDirectly(): Observable<any> {
    return this.http.get<any>('https://doronpay.com/api/merchants/permissions/get', {
      headers: this.getHeaders()
    }).pipe(
      catchError((err) => {
        console.error('Error loading permissions:', err);
        return of({ success: false, data: [] });
      })
    );
  }

  private loadMerchantsDirectly(): Observable<any> {
    return this.http.get<any>('https://doronpay.com/api/merchants/get', {
      headers: this.getHeaders()
    }).pipe(
      catchError((err) => {
        console.error('Error loading merchants:', err);
        return of({ success: false, data: [] });
      })
    );
  }

  // Replace loadAdmins method
  loadAdmins() {
    this.isLoading = true;
    
    this.http.get<any>('https://doronpay.com/api/admin/get', {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        if (response?.success) {
          this.admins = response.data;
          this.dataSource.data = this.admins;
          setTimeout(() => this.connectPaginatorAndSort());
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.isLoading = false;
      },
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
      // When updating, we send the form data without modifications
      // (password will not be included since we didn't add that control for editing)
      this.adminService
        .updateAdmin({ id: this.editingAdmin._id!, data: adminData })
        .subscribe({
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
          },
        });
    } else {
      // For new admins, the password field is already part of the form
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
        },
      });
    }
  }

  openAdminModal() {
    this.resetForm();
    this.showForm = true;
  }

  editAdmin(admin: Admin) {
    this.editingAdmin = admin;
    console.log('Editing admin with raw permissions:', admin.permissions);
    
    // Map the permission objects/strings to permission IDs
    const permissionIds = [];
    
    if (admin.permissions && Array.isArray(admin.permissions)) {
      for (const perm of admin.permissions as (Permission | string)[]) {
        if (typeof perm === 'object' && perm !== null && 'name' in perm) {
          // It's a permission object, find matching permission in availablePermissions
          const matchingPerm = this.availablePermissions.find(p => p.name === (perm as Permission).name);
          if (matchingPerm) {
            permissionIds.push(matchingPerm._id);
            console.log(`Mapped permission ${perm.name} to ID ${matchingPerm._id}`);
          } else {
            console.log(`Could not find matching permission for: ${perm.name}`);
          }
        } else if (typeof perm === 'string') {
          // It could be either a permission name or an ID
          // First try to find by ID
          const matchById = this.availablePermissions.find(p => p._id === perm);
          if (matchById) {
            permissionIds.push(matchById._id);
          } else {
            // Then try by name
            const matchByName = this.availablePermissions.find(p => p.name === perm);
            if (matchByName) {
              permissionIds.push(matchByName._id);
            } else {
              // If all else fails, just use the string
              console.log(`Using permission string directly: ${perm}`);
              permissionIds.push(perm);
            }
          }
        }
      }
    }
  
    console.log('Mapped permission IDs:', permissionIds);
    
    // Initialize form with mapped permission IDs
    this.initializeForm({
      ...admin,
      permissions: permissionIds
    });
    
    // Log the form values after initialization for debugging
    console.log('Form permissions after initialization:', this.adminForm.get('permissions')?.value);
    
    this.showForm = true;
  }

  isPermissionSelected(permissionId: string): boolean {
    const formPermissions = this.adminForm.get('permissions')?.value || [];
    return formPermissions.includes(permissionId);
  }

  openDeleteDialog(admin: Admin) {
    this.selectedAdmin = admin;
    this.dialogData = {
      title: 'Delete Admin',
      message: `Are you sure you want to delete ${admin.name}? This action cannot be undone.`,
      confirmButtonText: 'Delete',
      confirmButtonClass: 'btn-danger',
      action: 'delete',
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
      action: 'block',
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
      },
    });
  }

  toggleBlockStatus(admin: Admin) {
    // Only send the fields we want to update
    const updatedData = {
      blocked: !admin.blocked,
    };

    this.adminService
      .updateAdmin({ id: admin._id!, data: updatedData })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadAdmins();
          }
        },
        error: (error) =>
          console.error(
            `Error ${admin.blocked ? 'unblocking' : 'blocking'} admin:`,
            error
          ),
      });
  }

  resetForm() {
    this.editingAdmin = null;
    this.initializeForm();
    this.hidePassword = true;
    this.permissionSearchQuery = '';
    this.activePermissionTab = 'all';
  }

  // Helper method to get permission name from ID
  findPermissionName(permission: any): string {
    // If it's already a permission object with a name property
    if (
      typeof permission === 'object' &&
      permission !== null &&
      permission.name
    ) {
      return permission.name;
    }

    // If it's an ID, look it up
    const permissionObj = this.availablePermissions.find(
      (p) => p._id === permission
    );
    return permissionObj
      ? permissionObj.name
      : typeof permission === 'string'
      ? permission
      : 'Unknown';
  }

  // Helper method to get merchant name from ID
  findMerchantName(merchantId: string): string {
    const merchant = this.availableMerchants.find((m) => m._id === merchantId);
    return merchant ? merchant.merchant_tradeName : merchantId;
  }

  // Helper method to get badge class for a permission
  getPermissionBadgeClass(permission: any): string {
    let scope = '';

    if (typeof permission === 'object' && permission !== null) {
      // It's a permission object
      scope = permission.scope;
    } else if (typeof permission === 'string') {
      // It's a permission ID, look it up
      const foundPermission = this.availablePermissions.find(
        (p) => p._id === permission
      );
      if (foundPermission) {
        scope = foundPermission.scope;
      }
    }

    switch (scope) {
      case 'admin':
        return 'bg-indigo-100 text-indigo-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'merchant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // New methods for improved UI

  // Toggle permission details in admin list
  togglePermissionDetails(adminId: string) {
    // If this admin's permissions are already expanded, collapse them
    if (this.expandedPermissions[adminId]) {
      this.expandedPermissions[adminId] = false;
    } else {
      // Otherwise expand them
      this.expandedPermissions[adminId] = true;
    }
  }

  // Get permission categories for an admin
  getPermissionCategories(permissions: any[]) {
    const categories = [
      { name: 'System', permissions: [] as any[] },
      { name: 'Merchant', permissions: [] as any[] },
      { name: 'Account', permissions: [] as any[] },
      { name: 'Other', permissions: [] as any[] },
    ];

    // Make sure we have valid permissions before processing
    if (!permissions || !permissions.length) {
      return [];
    }

    // Process each permission (object or string)
    permissions.forEach((perm) => {
      // Get permission name - handle both object and string formats
      let permName = '';
      let permObj = null;

      if (typeof perm === 'object' && perm !== null && perm.name) {
        // It's a permission object
        permName = perm.name;
        permObj = perm;
      } else if (typeof perm === 'string') {
        // It's a permission ID or name
        permObj = this.availablePermissions.find(
          (p) => p._id === perm || p.name === perm
        );
        permName = permObj ? permObj.name : perm;
      }

      // Categorize based on name
      if (permName.includes('system')) {
        categories[0].permissions.push(permObj || perm);
      } else if (permName.includes('merchant')) {
        categories[1].permissions.push(permObj || perm);
      } else if (permName.includes('account')) {
        categories[2].permissions.push(permObj || perm);
      } else {
        categories[3].permissions.push(permObj || perm);
      }
    });

    // Only return categories with permissions
    return categories.filter((cat) => cat.permissions.length > 0);
  }

  // Filter permissions based on search and category
  getFilteredPermissionsByCategory(categoryId: string): Permission[] {
    let filteredPermissions: Permission[] = [];

    // First get permissions for the selected category
    if (categoryId === 'all') {
      filteredPermissions = [...this.availablePermissions];
    } else {
      const category = this.permissionCategories.find(
        (c) => c.id === categoryId
      );
      if (category) {
        filteredPermissions = [...category.permissions];
      }
    }

    // Then apply search filter if exists
    if (this.permissionSearchQuery) {
      const searchTerm = this.permissionSearchQuery.toLowerCase();
      filteredPermissions = filteredPermissions.filter((p) =>
        p.name.toLowerCase().includes(searchTerm)
      );
    }

    return filteredPermissions;
  }

  // Check if permission is selected
  // isPermissionSelected(permissionId: string): boolean {
  //   return this.adminForm.value.permissions.includes(permissionId);
  // }

  // Toggle a permission selection
  togglePermission(permissionId: string) {
    const currentPermissions = [...this.adminForm.value.permissions];
    const index = currentPermissions.indexOf(permissionId);

    if (index === -1) {
      // Add permission
      currentPermissions.push(permissionId);
    } else {
      // Remove permission
      currentPermissions.splice(index, 1);
    }

    this.adminForm.patchValue({ permissions: currentPermissions });
  }

  // Get selected permissions
  getSelectedPermissions(): string[] {
    return this.adminForm.value.permissions || [];
  }

  // Select all permissions in the current filtered view
  selectAllPermissions() {
    const currentPermissions = new Set([...this.adminForm.value.permissions]);
    const filteredPermissions = this.getFilteredPermissionsByCategory(
      this.activePermissionTab
    );

    filteredPermissions.forEach((permission) => {
      currentPermissions.add(permission._id);
    });

    this.adminForm.patchValue({ permissions: Array.from(currentPermissions) });
  }

  // Clear all permissions in the current filtered view
  clearPermissions() {
    const currentPermissions = new Set([...this.adminForm.value.permissions]);
    const filteredPermissions = this.getFilteredPermissionsByCategory(
      this.activePermissionTab
    );

    filteredPermissions.forEach((permission) => {
      currentPermissions.delete(permission._id);
    });

    this.adminForm.patchValue({ permissions: Array.from(currentPermissions) });
  }
}
