import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { PermissionService } from '../service/permissions.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '../components/alert/alert.component';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const requiredPermission = route.data['permission'] as string;
    
    if (!requiredPermission) {
      return true; // No permission required for this route
    }
    
    if (this.permissionService.hasPermission(requiredPermission)) {
      return true; // User has the required permission
    }
    
    // User doesn't have the required permission
    this.dialog.open(AlertComponent, {
      data: { 
        title: 'Access Denied', 
        message: 'You do not have permission to access this page.' 
      }
    });
    
    // Get the first available permission from the user's permissions
    const userPermissions = this.permissionService.getUserPermissions();
    const permissionMappings = [
        { path: 'mechant', permission: 'can view merchants module' },
        { path: 'admins',  permission: 'can view admins module' },
        { path: 'reports', permission: 'can view reports module' },
        { path: 'wallets', permission: 'can view wallets module' },
        { path: 'settlements', permission: 'can view merchant collections module' },
        { path: 'hub', permission: 'can view hub module' },
        { path: 'queues', permission: 'can view queues module' },
        { path: 'credit-debit', permission: 'can view credit/debit module' },
        { path: 'transactions', permission: 'can view transaction filters module' },
        { path: 'operator-config', permission: 'can view operator config module' },
        { path: 'velocity-rules', permission: 'can view velocity rules module' },
        { path: 'terminals', permission: 'can view payment terminals module' },
        { path: 'charge-config', permission: 'can view charge config module' },
        { path: 'merchant-tiers', permission: 'can view merchant tier module' },
        { path: 'daily-statistics', permission: 'can view daily statistics module' },
        { path: 'weekly-statistics', permission: 'can view weekly statistics module' },
        { path: 'monthly-statistics', permission: 'can view monthly statistics module' },
        { path: 'cummulative-statistics', permission: 'can view cumulative statistics module' },
        { path: 'logs', permission: 'can view system logs module' },
        { path: 'logs-summary', permission: 'can view logs summary module' },
        { path: 'payout-recon', permission: 'can view payout reconciliation module' },
        { path: 'payout-issues', permission: 'can view payout issues module' },
        { path: 'operator-switch', permission: 'can view operator switch module' },
        { path: 'merchant-statistics', permission: 'can view merchant statistics module' },
        { path: 'balance-history', permission: 'can view merchant balance history module' },
        { path: 'balance-summary', permission: 'can view merchant balance summary module' },
        { path: 'payment-links', permission: 'can view payment links module' },
        { path: 'account-blacklist', permission: 'can view account blacklist module' },
        { path: 'settings', permission: 'can view system settings module' },
        { path: 'permission-management', permission: 'can view system settings module' },
    ];
    
    // Find the first page the user has permission to access
    const firstAccessiblePage = permissionMappings.find(page => 
      userPermissions.includes(page.permission)
    );
    
    if (firstAccessiblePage) {
      this.router.navigate([`/${firstAccessiblePage.path}`]);
    } else {
      this.router.navigate(['/']); // Fallback to root
    }
    
    return false;
  }
}