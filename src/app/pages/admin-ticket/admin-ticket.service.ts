// admin-ticket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import API from '../../constants/api.constant';

export enum TicketCategory {
  PAYMENT = "Payment",
  VERIFICATION = "Verification",
  TECHNICAL = "Technical",
  OTHER = "Other",
}

export enum TicketPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
}

export enum TicketStatus {
  OPEN = "Open",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved",
  CLOSED = "Closed",
}

export interface Ticket {
  _id: string;
  merchantId: string | any;
  transactionRef?: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  status: TicketStatus;
  assignedTo?: string;
  comments?: Array<{
    text: string;
    createdBy: string;
    creatorType: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Merchant {
  _id: string;
  merchant_tradeName: string;
  email: string;
  phone: string;
  location?: string;
  lineOfBusiness?: string;
  registrationNumber?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contactPersonDesignation?: string;
  contact_person?: string;
  tierEnabled?: boolean;
  tierLevel?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  approvedDate?: string;
  onboardedBy?: string;
  autosettle?: boolean;
}

export interface UpdateTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedTo?: string;
  subject?: string;
  description?: string;
}

export interface CommentDto {
  text: string;
  createdBy: string;
  creatorType: string;
}

export interface PaginationOptions {
  limit: number;
  skip: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  merchantId?: string;
  searchQuery?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Admin {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    permissions?: any[];
  }

@Injectable({
  providedIn: 'root'
})
export class AdminTicketService {
  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private getAuthToken(): string {
    const loginData = localStorage.getItem('PLOGIN');
    if (loginData) {
      try {
        const parsedData = JSON.parse(loginData);
        return parsedData.token || '';
      } catch (error) {
        console.error('Error parsing auth token', error);
        return '';
      }
    }
    return '';
  }

  getUserInfo(): any {
    const loginData = localStorage.getItem('PLOGIN');
    if (loginData) {
      try {
        const parsedData = JSON.parse(loginData);
        return parsedData.user || null;
      } catch (error) {
        console.error('Error parsing user info', error);
        return null;
      }
    }
    return null;
  }

  // Get all tickets with pagination and filtering
  getAllTickets(options: PaginationOptions): Observable<PaginatedResponse<Ticket>> {
    let params = new HttpParams()
      .set('limit', options.limit.toString())
      .set('skip', options.skip.toString());
    
    if (options.status) {
      params = params.set('status', options.status);
    }
    
    if (options.priority) {
      params = params.set('priority', options.priority);
    }
    
    if (options.category) {
      params = params.set('category', options.category);
    }
    
    if (options.merchantId) {
      params = params.set('merchantId', options.merchantId);
    }

    return this.http.get<PaginatedResponse<Ticket>>(`${API}/tickets/get`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      tap(response => console.log('Retrieved tickets:', response)),
      catchError(this.handleError<PaginatedResponse<Ticket>>('getAllTickets'))
    );
  }

  getAdmins(): Observable<ApiResponse<Admin[]>> {
    return this.http.get<any>(`${API}/admin/get`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || 'Admins retrieved successfully',
        data: response.data || []
      })),
      catchError(this.handleError<Admin[]>('getAdmins'))
    );
  }

  // Get ticket by ID
  getTicketById(id: string): Observable<ApiResponse<Ticket>> {
    return this.http.get<any>(`${API}/tickets/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => console.log('Ticket detail response:', response)),
      map(response => ({
        success: response.success || true,
        message: response.message || 'Ticket retrieved successfully',
        data: response.data
      })),
      catchError(this.handleError<Ticket>('getTicketById'))
    );
  }

  // Get tickets for a specific merchant
  getTicketsByMerchantId(merchantId: string): Observable<ApiResponse<Ticket[]>> {
    return this.http.get<any>(`${API}/tickets/customer/${merchantId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || 'Merchant tickets retrieved successfully',
        data: response.data
      })),
      catchError(this.handleError<Ticket[]>('getTicketsByMerchantId'))
    );
  }

  // Get tickets for a specific transaction
  getTicketsByTransactionRef(transactionRef: string): Observable<ApiResponse<Ticket[]>> {
    return this.http.get<any>(`${API}/tickets/transaction/${transactionRef}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || 'Transaction tickets retrieved successfully',
        data: response.data
      })),
      catchError(this.handleError<Ticket[]>('getTicketsByTransactionRef'))
    );
  }

  // Update ticket (status, priority, etc.)
  updateTicket(id: string, data: UpdateTicketDto): Observable<ApiResponse<Ticket>> {
    return this.http.put<any>(`${API}/tickets/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || 'Ticket updated successfully',
        data: response.data
      })),
      catchError(this.handleError<Ticket>('updateTicket'))
    );
  }

  // Add comment to a ticket
  addComment(ticketId: string, commentData: CommentDto): Observable<ApiResponse<Ticket>> {
    return this.http.post<any>(`${API}/tickets/${ticketId}/comments`, commentData, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || 'Comment added successfully',
        data: response.data
      })),
      catchError(this.handleError<Ticket>('addComment'))
    );
  }

  // Delete a ticket
  deleteTicket(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<any>(`${API}/tickets/delete/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || 'Ticket deleted successfully',
        data: response.data
      })),
      catchError(this.handleError<any>('deleteTicket'))
    );
  }

  // Get all merchants
  getMerchants(): Observable<ApiResponse<Merchant[]>> {
    return this.http.get<any>(`${API}/merchants/get`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => ({
        success: response.success || true, 
        message: response.message || 'Merchants retrieved successfully',
        data: response.data || []
      })),
      catchError(this.handleError<Merchant[]>('getMerchants'))
    );
  }

  // Error handler
  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<any> => {
      console.error(`${operation} failed:`, error);
      
      // Create a user-friendly error message
      let errorMessage = 'An error occurred';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Return an observable with a user-facing error message
      return of({
        success: false,
        message: errorMessage,
        data: {} as T
      });
    };
  }
}