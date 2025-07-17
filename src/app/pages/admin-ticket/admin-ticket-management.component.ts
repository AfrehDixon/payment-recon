// admin-ticket-management.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { finalize, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { 
  AdminTicketService, 
  Ticket, 
  Merchant,
  TicketCategory, 
  TicketPriority, 
  TicketStatus,
  PaginationOptions,
  Admin
} from './admin-ticket.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-ticket-management',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    MatPaginatorModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-ticket-management.component.html',
  styleUrls: ['./admin-ticket-management.component.css']
})
export class AdminTicketManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  tickets: Ticket[] = [];
  merchants: Merchant[] = [];
  selectedTicket: Ticket | null = null;
  admins: Admin[] = [];
  
  ticketForm: FormGroup;
  commentForm: FormGroup;
  
  showTicketDetailModal = false;
  showEditTicketModal = false;
  showAssignTicketModal = false;
  showDeleteConfirmModal = false;
  
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;
  
  searchQuery = '';
  private searchSubject = new Subject<string>();
  
  statusFilter: TicketStatus | 'all' = 'all';
  priorityFilter: TicketPriority | 'all' = 'all';
  categoryFilter: TicketCategory | 'all' = 'all';
  merchantFilter: string | 'all' = 'all';
  
  ticketCategories = Object.values(TicketCategory);
  ticketPriorities = Object.values(TicketPriority);
  ticketStatuses = Object.values(TicketStatus);
  
  // Pagination
  totalTickets = 0;
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Staff list (should be populated from your staff service)
  staffMembers = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Mike Johnson' }
  ];

  constructor(
    private fb: FormBuilder,
    private adminTicketService: AdminTicketService
  ) {
    this.ticketForm = this.fb.group({
      status: ['', Validators.required],
      priority: ['', Validators.required],
      category: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      assignedTo: ['']
    });

    this.commentForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(1)]]
    });
    
    // Set up search with debounce
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchQuery = searchTerm;
      this.loadTickets();
    });
  }

  ngOnInit(): void {
    this.loadMerchants();
    this.loadTickets();
    this.loadAdmins();
  }

  loadMerchants(): void {
    this.adminTicketService.getMerchants().subscribe(response => {
      if (response.success) {
        this.merchants = response.data;
      } else {
        console.error('Failed to load merchants:', response.message);
      }
    });
  }

  loadAdmins(): void {
    this.adminTicketService.getAdmins().subscribe(response => {
      if (response.success) {
        this.admins = response.data;
      } else {
        console.error('Failed to load admins:', response.message);
      }
    });
  }

  loadTickets(): void {
    this.isLoading = true;
    this.error = null;

    const options: PaginationOptions = {
      limit: this.pageSize,
      skip: this.currentPage * this.pageSize,
    };

    if (this.statusFilter !== 'all') {
      options.status = this.statusFilter;
    }

    if (this.priorityFilter !== 'all') {
      options.priority = this.priorityFilter;
    }

    if (this.categoryFilter !== 'all') {
      options.category = this.categoryFilter;
    }

    if (this.merchantFilter !== 'all') {
      options.merchantId = this.merchantFilter;
    }

    if (this.searchQuery) {
      options.searchQuery = this.searchQuery;
    }

    this.adminTicketService.getAllTickets(options).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        this.tickets = response.data;
        this.totalTickets = response.pagination.total;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.error = 'Failed to load tickets. Please try again.';
      }
    });
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchSubject.next(term);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  applyFilter(filterType: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    
    switch (filterType) {
      case 'status':
        this.statusFilter = value as TicketStatus | 'all';
        break;
      case 'priority':
        this.priorityFilter = value as TicketPriority | 'all';
        break;
      case 'category':
        this.categoryFilter = value as TicketCategory | 'all';
        break;
      case 'merchant':
        this.merchantFilter = value;
        break;
    }
    
    // Reset to first page when filter changes
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.currentPage = 0;
    this.loadTickets();
  }
  clearFilters(): void {
    this.statusFilter = 'all';
    this.priorityFilter = 'all';
    this.categoryFilter = 'all';
    this.merchantFilter = 'all';
    this.searchQuery = '';
    
    // Reset to first page
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.currentPage = 0;
    this.loadTickets();
  }

  openTicketDetail(ticket: Ticket): void {
    this.isLoading = true;
    this.error = null;
  
    this.adminTicketService.getTicketById(ticket._id).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Ticket detail response:', response);
          this.selectedTicket = response.data;
          this.showTicketDetailModal = true;
        } else {
          this.error = response.message || 'Failed to load ticket details';
        }
      },
      error: (error) => {
        console.error('Error loading ticket details:', error);
        this.error = 'Failed to load ticket details. Please try again.';
      }
    });
  }

  openEditTicketModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.ticketForm.patchValue({
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      assignedTo: ticket.assignedTo || ''
    });
    this.showEditTicketModal = true;
  }

  openAssignTicketModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.ticketForm.patchValue({
      assignedTo: ticket.assignedTo || ''
    });
    this.showAssignTicketModal = true;
  }

  openDeleteConfirmModal(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.showDeleteConfirmModal = true;
  }

  closeTicketDetailModal(): void {
    this.showTicketDetailModal = false;
    this.selectedTicket = null;
    this.commentForm.reset();
  }

  closeEditTicketModal(): void {
    this.showEditTicketModal = false;
    this.selectedTicket = null;
    this.ticketForm.reset();
  }

  closeAssignTicketModal(): void {
    this.showAssignTicketModal = false;
    this.selectedTicket = null;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.selectedTicket = null;
  }

  updateTicket(): void {
    if (this.ticketForm.invalid || !this.selectedTicket) return;

    this.isSubmitting = true;
    this.error = null;

    const updateData = this.ticketForm.value;

    this.adminTicketService.updateTicket(this.selectedTicket._id, updateData).pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Ticket updated successfully';
          // Auto-hide success message after 5 seconds
          setTimeout(() => this.success = null, 5000);
          
          this.closeEditTicketModal();
          this.loadTickets();
        } else {
          this.error = response.message || 'Failed to update ticket';
        }
      },
      error: (error) => {
        console.error('Error updating ticket:', error);
        this.error = 'Failed to update ticket. Please try again.';
      }
    });
  }

  assignTicket(): void {
    if (!this.selectedTicket) return;
  
    this.isSubmitting = true;
    this.error = null;
  
    const assignedTo = this.ticketForm.get('assignedTo')?.value;
  
    this.adminTicketService.updateTicket(this.selectedTicket._id, { 
      assignedTo,
      status: TicketStatus.IN_PROGRESS // Optionally update status to In Progress
    }).pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Ticket assigned successfully';
          // Auto-hide success message after 5 seconds
          setTimeout(() => this.success = null, 5000);
          
          this.closeAssignTicketModal();
          this.loadTickets();
        } else {
          this.error = response.message || 'Failed to assign ticket';
        }
      },
      error: (error) => {
        console.error('Error assigning ticket:', error);
        this.error = 'Failed to assign ticket. Please try again.';
      }
    });
  }
  
  // Add a helper method to get admin name
  getAdminName(adminId: string): string {
    const admin = this.admins.find(a => a._id === adminId);
    return admin ? admin.name : 'Unassigned';
  }

  deleteTicket(): void {
    if (!this.selectedTicket) return;

    this.isSubmitting = true;
    this.error = null;

    this.adminTicketService.deleteTicket(this.selectedTicket._id).pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Ticket deleted successfully';
          // Auto-hide success message after 5 seconds
          setTimeout(() => this.success = null, 5000);
          
          this.closeDeleteConfirmModal();
          this.loadTickets();
        } else {
          this.error = response.message || 'Failed to delete ticket';
        }
      },
      error: (error) => {
        console.error('Error deleting ticket:', error);
        this.error = 'Failed to delete ticket. Please try again.';
      }
    });
  }

  addComment(): void {
    if (this.commentForm.invalid || !this.selectedTicket) return;

    this.isSubmitting = true;
    this.error = null;

    const userInfo = this.adminTicketService.getUserInfo();
    if (!userInfo) {
      this.error = 'User information not found. Please log in again.';
      this.isSubmitting = false;
      return;
    }

    const commentData = {
      text: this.commentForm.value.text,
      createdBy: userInfo._id,
      creatorType: 'staff' // Staff comment
    };

    this.adminTicketService.addComment(this.selectedTicket._id, commentData).pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Comment added successfully';
          // Auto-hide success message after 5 seconds
          setTimeout(() => this.success = null, 5000);
          
          this.commentForm.reset();
          // Update the selected ticket with the new comment
          this.selectedTicket = response.data;
          
          // Also refresh tickets list
          this.loadTickets();
        } else {
          this.error = response.message || 'Failed to add comment';
        }
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.error = 'Failed to add comment. Please try again.';
      }
    });
  }

  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadTickets();
  }

  updateTicketStatus(ticket: Ticket, status: TicketStatus): void {
    this.isLoading = true;
    this.error = null;

    this.adminTicketService.updateTicket(ticket._id, { status }).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = `Ticket status updated to ${status}`;
          // Auto-hide success message after 5 seconds
          setTimeout(() => this.success = null, 5000);
          
          // Update ticket in the list
          const index = this.tickets.findIndex(t => t._id === ticket._id);
          if (index !== -1) {
            this.tickets[index] = response.data;
          }
          
          // If the selected ticket is being viewed, update it
          if (this.selectedTicket && this.selectedTicket._id === ticket._id) {
            this.selectedTicket = response.data;
          }
        } else {
          this.error = response.message || 'Failed to update ticket status';
        }
      },
      error: (error) => {
        console.error('Error updating ticket status:', error);
        this.error = 'Failed to update ticket status. Please try again.';
      }
    });
  }

  getMerchantName(merchantId: string): string {
    const merchant = this.merchants.find(m => m._id === merchantId);
    return merchant ? merchant.merchant_tradeName : 'Unknown Merchant';
  }

  getStatusClass(status: TicketStatus | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case TicketStatus.OPEN:
        return 'bg-blue-100 text-blue-800';
      case TicketStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.RESOLVED:
        return 'bg-green-100 text-green-800';
      case TicketStatus.CLOSED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityClass(priority: TicketPriority | undefined): string {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    switch (priority) {
      case TicketPriority.LOW:
        return 'bg-green-100 text-green-800';
      case TicketPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TicketPriority.HIGH:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getCategoryClass(category: TicketCategory | undefined): string {
    if (!category) return 'bg-gray-100 text-gray-800';
    
    switch (category) {
      case TicketCategory.PAYMENT:
        return 'bg-purple-100 text-purple-800';
      case TicketCategory.VERIFICATION:
        return 'bg-indigo-100 text-indigo-800';
      case TicketCategory.TECHNICAL:
        return 'bg-cyan-100 text-cyan-800';
      case TicketCategory.OTHER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }
}