import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';
import { CommonModule } from '@angular/common';

interface Permission {
  _id?: string;
  name: string;
  scope: 'admin' | 'merchant';
  createdAt?: Date;
}

@Component({
  selector: 'app-permission-management',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  templateUrl: './permission-management.component.html',
  styleUrls: ['./permission-management.component.css']
})
export class PermissionManagementComponent implements OnInit {
  permissions: Permission[] = [];
  loading = true;
  error: string | null = null;
  isAddModalOpen = false;
  isDeleteModalOpen = false;
  selectedPermission: Permission | null = null;

  // Predefined permission names from backend enum
  permissionNames = [
    "can view merchants module",
    "can access action button in merchant module",
    "can view admins module",
    "can onboard admin",
    "can edit admin",
    "can delete admin",
    "can block admin",
    "can view reports module",
    "can download reports",
    "can view wallets module",
    "can view wallet details",
    "can add wallet module",
    "can view merchant collections module",
    "can view hub module",
    "can add new application",
    "can generate new api key",
    "can view transactions",
    "can edit application",
    "can view api key",
    "can view queues module",
    "can view credit/debit module",
    "can process credit",
    "can process debit",
    "can view transaction filters module",
    "can view operator config module",
    "can add operator config",
    "can edit operator config",
    "can view velocity rules module",
    "can add velocity rule",
    "can edit velocity rule",
    "can disable velocity rule",
    "can view payment terminals module",
    "can add terminal",
    "can view terminal details",
    "can disable terminal",
    "can suspend terminal",
    "can view charge config module",
    "can add charge config",
    "can edit charge config",
    "can view merchant tier module",
    "can add merchant tier",
    "can edit merchant tier",
    "can view daily statistics module",
    "can view monthly statistics module",
    "can view weekly statistics module",
    "can view cumulative statistics module",
    "can view system logs module",
    "can view logs summary module",
    "can view payout reconciliation module",
    "can run payout reconciliation",
    "can view payout issues module",
    "can view operator switch module",
    "can run manual switch",
    "can run analysis",
    "can start service",
    "can view merchant statistics module",
    "can view merchant balance history module",
    "can view merchant balance summary module",
    "can view payment links module",
    "can view account blacklist module",
    "can add account blacklist",
    "can edit account blacklist",
    "can disable account balcklist",
    "can view system settings module",
    "can edit system setings",
    "can view merchant details",
    "can top up merchant",
    "can check check merchant",
    "can approve merchant",
    "can view merchant transactions",
    "can view merchant settlements",
    "can settle merchant",
    "can toggle merchant auto settle",
    "can toggle merchant tiers"
  ];

  // Forms
  addForm: FormGroup;
  deleteForm: FormGroup;

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
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadPermissions(): void {
    this.loading = true;
    this.http.get<{success: boolean, data: Permission[]}>(
      'https://doronpay.com/api/merchants/permissions/get',
      { headers: this.getHeaders() }
    ).subscribe(
      (response) => {
        if (response.success) {
          this.permissions = response.data;
        } else {
          this.error = 'Failed to load permissions';
        }
        this.loading = false;
      },
      (error) => {
        this.error = 'Failed to load permissions';
        this.loading = false;
        console.error(error);
      }
    );
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
    ).subscribe(
      () => {
        this.loadPermissions();
        this.closeAddModal();
      },
      (error) => {
        this.error = 'Failed to add permission';
        console.error(error);
      }
    );
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
    ).subscribe(
      () => {
        this.loadPermissions();
        this.closeDeleteModal();
      },
      (error) => {
        this.error = 'Failed to delete permission';
        console.error(error);
      }
    );
  }
}