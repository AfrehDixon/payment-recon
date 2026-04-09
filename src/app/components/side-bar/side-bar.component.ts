import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthState } from '../../state/apps/app.states';
import { PermissionService } from '../../service/permissions.service';
import { Logout } from '../../state/apps/app.actions';

export interface RouteInfo {
  path: string;
  title: string;
  class: string | string[] | Set<string> | { [klass: string]: any; } | null | undefined;
  permission: string;
  isSubmenu?: boolean;
  parentModule?: string;
}

export interface MenuGroup {
  title: string;
  icon: string;
  permission: string;
  isOpen: boolean;
  children: RouteInfo[];
}

export const Routes: RouteInfo[] = [
  // Merchant Management
  { path: 'mechant', title: 'Merchants', class: 'false', permission: 'can view merchants module', parentModule: 'merchant-management' },
  { path: 'merchant-tiers', title: 'Merchant Tiers', class: 'false', permission: 'can view merchant tier module', parentModule: 'merchant-management' },
  // { path: 'merchant-statistics', title: 'Merchant Statistics', class: 'false', permission: 'can view merchant statistics module', parentModule: 'merchant-management' },
  // { path: 'balance-history', title: 'Balance History', class: 'false', permission: 'can view merchant balance history module', parentModule: 'merchant-management' },
  // { path: 'balance-summary', title: 'Balance Summary', class: 'false', permission: 'can view merchant balance summary module', parentModule: 'merchant-management' },
  
  // Transactions
  { path: 'transactions', title: 'Transaction Filters', class: 'false', permission: 'can view transaction filters module', parentModule: 'transactions' },
  { path: 'reversals', title: 'Reversals', class: 'false', permission: 'can view operator switch module', parentModule: 'transactions' },
  { path: 'credit-debit', title: 'Credit/Debit', class: 'false', permission: 'can view credit/debit module', parentModule: 'transactions' },
  { path: 'trx-transfer', title: 'Transaction Transfer', class: 'false', permission: 'can view admins module', parentModule: 'transactions' },
  
  // Wallets & Payments
  { path: 'wallets', title: 'Wallets', class: 'false', permission: 'can view wallets module', parentModule: 'wallets-payments' },
  { path: 'card-wallets', title: 'Customer Wallets', class: 'false', permission: 'can view admins module', parentModule: 'wallets-payments' },
  { path: 'payment-links', title: 'Payment Links', class: 'false', permission: 'can view payment links module', parentModule: 'wallets-payments' },
  { path: 'terminals', title: 'Payment Terminals', class: 'false', permission: 'can view payment terminals module', parentModule: 'wallets-payments' },
  // { path: 'deposit-addresses', title: 'Deposit Addresses', class: 'false', permission: 'can view admins module', parentModule: 'wallets-payments' },
  {  path: 'wallet-addresses', title: 'Wallet Addresses', class: 'false', permission: 'can view admins module', parentModule: 'wallets-payments' },
  {  path: 'accounts/ledger', title: 'Account Ledger', class: 'false', permission: 'can view wallets module', parentModule: 'wallets-payments' },

  // Settlements & Payouts
  { path: 'settlements', title: 'Merchant Collections', class: 'false', permission: 'can view merchant collections module', parentModule: 'settlements-payouts' },
  // { path: 'payout-recon', title: 'Payout Reconciliation', class: 'false', permission: 'can view payout reconciliation module', parentModule: 'settlements-payouts' },
  // { path: 'payout-issues', title: 'Payout Issues', class: 'false', permission: 'can view payout issues module', parentModule: 'settlements-payouts' },
  { path: 'consolidations', title: 'Consolidations', class: 'false', permission: 'can view admins module', parentModule: 'settlements-payouts' },
  
  // Analytics & Reports
  { path: 'reports', title: 'Reports', class: 'false', permission: 'can view reports module', parentModule: 'analytics-reports' },
  { path: 'daily-statistics', title: 'Daily Statistics', class: 'false', permission: 'can view daily statistics module', parentModule: 'analytics-reports' },
  { path: 'weekly-statistics', title: 'Weekly Statistics', class: 'false', permission: 'can view weekly statistics module', parentModule: 'analytics-reports' },
  { path: 'monthly-statistics', title: 'Monthly Statistics', class: 'false', permission: 'can view monthly statistics module', parentModule: 'analytics-reports' },
  { path: 'cummulative-statistics', title: 'Cumulative Statistics', class: 'false', permission: 'can view cumulative statistics module', parentModule: 'analytics-reports' },
  
  // System Configuration
  { path: 'operator-config', title: 'Operator Config', class: 'false', permission: 'can view operator config module', parentModule: 'system-config' },
  { path: 'charge-config', title: 'Charge Config', class: 'false', permission: 'can view charge config module', parentModule: 'system-config' },
  { path: 'velocity-rules', title: 'Velocity Rules', class: 'false', permission: 'can view velocity rules module', parentModule: 'system-config' },
  { path: 'valut-config', title: 'Vault Management', class: 'false', permission: 'can view operator switch module', parentModule: 'system-config' },
  // { path: 'operator-switch', title: 'Operator Switch', class: 'false', permission: 'can view operator switch module', parentModule: 'system-config' },
  { path: 'account-blacklist', title: 'Account Blacklist', class: 'false', permission: 'can view account blacklist module', parentModule: 'system-config' },
  
  // System Management
  { path: 'admins', title: 'Admins', class: 'false', permission: 'can view admins module', parentModule: 'system-management' },
  { path: 'permission-management', title: 'Permission Management', class: 'false', permission: 'can view system settings module', parentModule: 'system-management' },
  { path: 'settings', title: 'System Settings', class: 'false', permission: 'can view system settings module', parentModule: 'system-management' },
  { path: 'tickets', title: 'Admin Tickets', class: 'false', permission: 'can view admins module', parentModule: 'system-management' },
  
  // Monitoring & Logs
  { path: 'logs', title: 'System Logs', class: 'false', permission: 'can view system logs module', parentModule: 'monitoring-logs' },
  { path: 'logs-summary', title: 'Logs Summary', class: 'false', permission: 'can view logs summary module', parentModule: 'monitoring-logs' },
  // { path: 'queues', title: 'Queues', class: 'false', permission: 'can view queues module', parentModule: 'monitoring-logs' },
  { path: 'hub', title: "Hub", class: 'false', permission: 'can view hub module', parentModule: 'monitoring-logs' },
  { path: 'credit-queue', title: 'Credit Queue', class: 'false', permission: 'can view wallets module', parentModule: 'monitoring-logs' },
  {  path: 'cron-jobs', title: 'Cron Jobs', class: 'false', permission: 'can view system logs module', parentModule: 'monitoring-logs' },
];

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  logo: string = "";
  menuItems: RouteInfo[] = [];
  user_name: string = "";
  isCollapsed: boolean = false;
  isMobile: boolean = false;
  
  @Select(AuthState.user) user$: any;
  private userSubscription?: Subscription;
  private permissionsSubscription?: Subscription;

  constructor(
    private store: Store,
    public router: Router,
    private permissionService: PermissionService
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.setupEventListeners();
    
    if (this.user$) {
      this.userSubscription = this.user$.subscribe((user: any) => {
        if (user) {
          this.user_name = user.name || 'User';
        }
      });
    }
    
    const loginData = localStorage.getItem('PLOGIN');
    if (loginData) {
      try {
        const parsedData = JSON.parse(loginData);
        if (parsedData.user && parsedData.user.name) {
          this.user_name = parsedData.user.name;
        }
      } catch (error) {
        console.error('Error parsing user data from local storage', error);
      }
    }
    
    this.permissionsSubscription = this.permissionService.getPermissions()
      .subscribe(permissions => {
        this.filterMenuItems(permissions);
      });
  }

  ngOnDestroy(): void {
    if (this.permissionsSubscription) {
      this.permissionsSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  private filterMenuItems(permissions: string[]): void {
    // Filter menu items based on permissions
    this.menuItems = Routes.filter(item => permissions.includes(item.permission));
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.checkScreenSize();
    if (this.isMobile) {
      this.isCollapsed = true;
    }
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 991.98;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebarState', this.isCollapsed ? 'collapsed' : 'expanded');
  }

  isActive(path: string): boolean {
    return this.router.isActive(path, true);
  }


  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.store.dispatch(new Logout());
    }
  }

  // Add this method to your SidebarComponent class
getIconForMenuItem(menuItem: RouteInfo): string {
  // Map parent modules to icons
  const iconMap: { [key: string]: string } = {
    'merchant-management': 'bi bi-people',
    'transactions': 'bi bi-arrow-left-right',
    'wallets-payments': 'bi bi-wallet2',
    'settlements-payouts': 'bi bi-cash-stack',
    'analytics-reports': 'bi bi-graph-up',
    'system-config': 'bi bi-gear',
    'system-management': 'bi bi-person-badge',
    'monitoring-logs': 'bi bi-clipboard-data'
  };
  
  // Return the icon based on parent module, or a default icon
  return iconMap[menuItem.parentModule || ''] || 'bi bi-circle';
}
}