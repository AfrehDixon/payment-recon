import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';

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
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './admin-management.component.html',
  styleUrls: ['./admin-management.component.css']
})
export class AdminManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
Math = Math;
  displayedColumns: string[] = ['name', 'email', 'role', 'account_type', 'status', 'actions'];
  dataSource!: MatTableDataSource<Admin>;
  adminForm!: FormGroup;
  admins: Admin[] = [];
  isLoading = false;
  showForm = false;
  editingAdmin: Admin | null = null;
  hidePassword = true;

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm(admin?: Admin) {
    this.adminForm = this.fb.group({
      email: [admin?.email || '', [Validators.required, Validators.email]],
      password: [!admin ? '' : null, !admin ? Validators.required : null],
      name: [admin?.name || '', Validators.required],
      role: [admin?.role || 'normal', Validators.required],
      blocked: [admin?.blocked || false],
      account_type: [admin?.account_type || 'admin'],
      merchantId: [admin?.merchantId || '']
    });
  }

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    this.isLoading = true;
    this.adminService.getAdmins().subscribe({
      next: (response) => {
        if (response.success) {
          this.admins = response.data;
          this.dataSource = new MatTableDataSource(this.admins);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
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
    this.dataSource.filter = filterValue.trim().toLowerCase();

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

  editAdmin(admin: Admin) {
    this.editingAdmin = admin;
    this.initializeForm(admin);
    this.showForm = true;
  }

  deleteAdmin(admin: Admin) {
    if (confirm(`Are you sure you want to delete ${admin.name}? This action cannot be undone.`)) {
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
  }

  toggleBlockStatus(admin: Admin) {
    const action = admin.blocked ? 'unblock' : 'block';
    if (confirm(`Are you sure you want to ${action} ${admin.name}?`)) {
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
        error: (error) => console.error(`Error ${action}ing admin:`, error)
      });
    }
  }

  resetForm() {
    this.editingAdmin = null;
    this.showForm = false;
    this.initializeForm();
    this.hidePassword = true;
  }
}