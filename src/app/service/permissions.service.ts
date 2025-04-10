import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface PermissionObject {
  _id: string;
  scope: string;
  name: string;
  createdAt: string;
  __v: number;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private userPermissions = new BehaviorSubject<string[]>([]);
  
  constructor() { 
    // Initialize permissions from localStorage on service creation
    this.initFromLocalStorage();
  }

  private initFromLocalStorage(): void {
    const loginData = localStorage.getItem('PLOGIN');
    if (loginData) {
      try {
        const parsedData = JSON.parse(loginData);
        if (parsedData.user && parsedData.user.permissions) {
          // Extract just the permission names from the permission objects
          const permissionNames = this.extractPermissionNames(parsedData.user.permissions);
          this.userPermissions.next(permissionNames);
        }
      } catch (error) {
        console.error('Error parsing permissions from local storage', error);
      }
    }
  }

  // New helper method to extract permission names from permission objects
  private extractPermissionNames(permissions: any[]): string[] {
    if (!permissions || !Array.isArray(permissions)) return [];
    
    return permissions.map(perm => {
      // Check if it's a permission object or just a string
      if (typeof perm === 'object' && perm !== null && perm.name) {
        return perm.name;
      }
      return perm; // If it's already a string, return as is
    });
  }

  /**
   * Set user permissions - updated to handle permission objects
   * @param permissions Array of permission objects or strings
   */
  setPermissions(permissions: any[]): void {
    const permissionNames = this.extractPermissionNames(permissions);
    console.log('Setting permissions:', permissionNames);
    this.userPermissions.next(permissionNames);
  }

  /**
   * Clear all permissions (usually on logout)
   */
  clearPermissions(): void {
    this.userPermissions.next([]);
  }

  /**
   * Get current permissions as observable
   */
  getPermissions(): Observable<string[]> {
    return this.userPermissions.asObservable();
  }
  
  /**
   * Get current permissions as an array (not observable)
   */
  getUserPermissions(): string[] {
    return this.userPermissions.value;
  }

  /**
   * Check if user has a specific permission
   * @param permission Permission to check
   */
  hasPermission(permission: string): boolean {
    return this.userPermissions.value.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param permissions Array of permissions to check
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   * @param permissions Array of permissions to check
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }
}