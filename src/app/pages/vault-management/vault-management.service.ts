import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Interfaces based on your updated backend types
export interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
  salt: string;
  algorithm: string;
  keyVersion: number;
}

export interface AccessHistoryEntry {
  accessedAt: Date;
  accessedBy: string;
  operation: string;
  success: boolean;
}

export interface VaultEntry {
  _id?: string;
  identifier: string; // Unique identifier for the entry
  encryptedData: EncryptedData;
  type: 'private_key' | 'mnemonic'; 
  network?: 'BEP20' | 'SOLANA' | 'ETHEREUM' | 'BITCOIN';
  keyVersion: number;
  createdAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  isActive: boolean;
  expiresAt?: Date;
  metadata?: any;
  // Audit fields
  createdBy?: string;
  lastAccessedBy?: string;
  accessHistory?: AccessHistoryEntry[];
}

export interface VaultStatistics {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  networkBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>; // Changed from purposeBreakdown
  recentActivity: number;
}

export interface VaultFilters {
  isActive?: boolean;
  network?: string;
  type?: string; // Changed from purpose
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface VaultEntriesResponse {
  entries: VaultEntry[];
  total: number;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VaultService {
  private readonly baseUrl = 'https://doronpay.com/api/vault'; 
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Create new vault entry
   */
  createVaultEntry(data: {
    data: string;
    identifier: string;
    type: 'private_key' | 'mnemonic';
    network?: string;
    expiresAt?: Date;
    metadata?: any;
  }): Observable<{ vaultId: string }> {
    this.setLoading(true);
    
    return this.http.post<ApiResponse<{ vaultId: string }>>(`${this.baseUrl}/entries`, data)
      .pipe(
        map(response => response.data),
        catchError(this.handleError),
        map(data => {
          this.setLoading(false);
          return data;
        })
      );
  }

  /**
   * Get vault statistics
   */
  getVaultStatistics(): Observable<VaultStatistics> {
    this.setLoading(true);
    return this.http.get<ApiResponse<VaultStatistics>>(`${this.baseUrl}/stats`)
      .pipe(
        map(response => response.data),
        catchError((error) => {
          console.warn('Statistics endpoint not available:', error);
          // Return empty statistics object as fallback
          const emptyStats: VaultStatistics = {
            totalEntries: 0,
            activeEntries: 0,
            expiredEntries: 0,
            networkBreakdown: {},
            typeBreakdown: {},
            recentActivity: 0
          };
          this.setLoading(false);
          throw error; // Still throw error so component can handle with calculateStatisticsFromEntries
        }),
        map(data => {
          this.setLoading(false);
          return data;
        })
      );
  }

  /**
   * List vault entries with optional filters
   */
  listVaultEntries(filters: VaultFilters = {}): Observable<VaultEntriesResponse> {
    this.setLoading(true);
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof VaultFilters];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<VaultEntriesResponse>>(`${this.baseUrl}/entries`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError),
        map(data => {
          this.setLoading(false);
          return data;
        })
      );
  }

  /**
   * Deactivate a vault entry
   */
  deactivateVaultEntry(identifier: string): Observable<string> {
    this.setLoading(true);
    const payload = { identifier };
    
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/deactivate`, payload)
      .pipe(
        map(response => response.message || 'Entry deactivated successfully'),
        catchError(this.handleError),
        map(message => {
          this.setLoading(false);
          return message;
        })
      );
  }

  /**
   * Cleanup expired entries
   */
  cleanupExpiredEntries(): Observable<{ expiredCount: number; message: string }> {
    this.setLoading(true);
    
    return this.http.post<ApiResponse<{ expiredCount: number }>>(`${this.baseUrl}/cleanup`, {})
      .pipe(
        map(response => ({
          expiredCount: response.data.expiredCount,
          message: response.message || `Cleaned up ${response.data.expiredCount} expired entries`
        })),
        catchError(this.handleError),
        map(data => {
          this.setLoading(false);
          return data;
        })
      );
  }

  /**
   * Create backup (metadata only)
   */
  createBackup(): Observable<{ timestamp: Date; entryCount: number; message: string }> {
    this.setLoading(true);
    
    return this.http.post<ApiResponse<{ timestamp: Date; entryCount: number }>>(`${this.baseUrl}/backup`, {})
      .pipe(
        map(response => ({
          timestamp: response.data.timestamp,
          entryCount: response.data.entryCount,
          message: response.message || 'Backup created successfully'
        })),
        catchError(this.handleError),
        map(data => {
          this.setLoading(false);
          return data;
        })
      );
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError = (error: any): Observable<never> => {
    this.setLoading(false);
    console.error('Vault Service Error:', error);
    throw error;
  };
}