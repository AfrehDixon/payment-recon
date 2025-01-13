import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { QueueItem, QueueStats, QueueFilters, PaginatedResponse } from './queue.interface';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private apiUrl = 'https://doronpay.com/api/queue';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('Content-Type', 'application/json');
  }

  getQueueItems(filters: Omit<QueueFilters, 'page' | 'limit'>): Observable<PaginatedResponse<QueueItem>> {
    let params = new HttpParams();
    
    // Only add non-pagination filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });
  
    return this.http.get<PaginatedResponse<QueueItem>>(`${this.apiUrl}/items`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getQueueStats(): Observable<{ success: boolean; data: QueueStats[] }> {
    return this.http.get<{ success: boolean; data: QueueStats[] }>(`${this.apiUrl}/stats`);
  }

  getQueueItemById(id: string): Observable<{ success: boolean; data: QueueItem }> {
    return this.http.get<{ success: boolean; data: QueueItem }>(`${this.apiUrl}/${id}`);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else if (error.status === 0) {
      errorMessage = 'Could not connect to the server. Please check your internet connection.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'Access forbidden. You do not have permission to perform this action.';
    } else if (error.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (error.status >= 500) {
      errorMessage = 'A server error occurred. Please try again later.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Server Error: ${error.status} ${error.message}`;
    }

    console.error('Error occurred:', error);
    return throwError(() => new Error(errorMessage));
  }
}