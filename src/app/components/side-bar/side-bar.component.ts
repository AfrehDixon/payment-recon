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
  { path: 'merchant-statistics', title: 'Merchant Statistics', class: 'false', permission: 'can view merchant statistics module', parentModule: 'merchant-management' },
  { path: 'balance-history', title: 'Balance History', class: 'false', permission: 'can view merchant balance history module', parentModule: 'merchant-management' },
  { path: 'balance-summary', title: 'Balance Summary', class: 'false', permission: 'can view merchant balance summary module', parentModule: 'merchant-management' },
  
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
  { path: 'deposit-addresses', title: 'Deposit Addresses', class: 'false', permission: 'can view admins module', parentModule: 'wallets-payments' },
  
  // Settlements & Payouts
  { path: 'settlements', title: 'Merchant Collections', class: 'false', permission: 'can view merchant collections module', parentModule: 'settlements-payouts' },
  { path: 'payout-recon', title: 'Payout Reconciliation', class: 'false', permission: 'can view payout reconciliation module', parentModule: 'settlements-payouts' },
  { path: 'payout-issues', title: 'Payout Issues', class: 'false', permission: 'can view payout issues module', parentModule: 'settlements-payouts' },
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
  { path: 'operator-switch', title: 'Operator Switch', class: 'false', permission: 'can view operator switch module', parentModule: 'system-config' },
  { path: 'account-blacklist', title: 'Account Blacklist', class: 'false', permission: 'can view account blacklist module', parentModule: 'system-config' },
  
  // System Management
  { path: 'admins', title: 'Admins', class: 'false', permission: 'can view admins module', parentModule: 'system-management' },
  { path: 'permission-management', title: 'Permission Management', class: 'false', permission: 'can view system settings module', parentModule: 'system-management' },
  { path: 'settings', title: 'System Settings', class: 'false', permission: 'can view system settings module', parentModule: 'system-management' },
  { path: 'tickets', title: 'Admin Tickets', class: 'false', permission: 'can view admins module', parentModule: 'system-management' },
  
  // Monitoring & Logs
  { path: 'logs', title: 'System Logs', class: 'false', permission: 'can view system logs module', parentModule: 'monitoring-logs' },
  { path: 'logs-summary', title: 'Logs Summary', class: 'false', permission: 'can view logs summary module', parentModule: 'monitoring-logs' },
  { path: 'queues', title: 'Queues', class: 'false', permission: 'can view queues module', parentModule: 'monitoring-logs' },
  { path: 'hub', title: "Hub", class: 'false', permission: 'can view hub module', parentModule: 'monitoring-logs' }
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
  allMenuItems: RouteInfo[] = Routes;
  menuGroups: MenuGroup[] = [];
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
    this.initializeMenuGroups();
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

  private initializeMenuGroups(): void {
    this.menuGroups = [
      {
        title: 'Merchant Management',
        icon: 'bi bi-people',
        permission: 'merchant-management',
        isOpen: false,
        children: []
      },
      {
        title: 'Transactions',
        icon: 'bi bi-arrow-left-right',
        permission: 'transactions',
        isOpen: false,
        children: []
      },
      {
        title: 'Wallets & Payments',
        icon: 'bi bi-wallet2',
        permission: 'wallets-payments',
        isOpen: false,
        children: []
      },
      {
        title: 'Settlements & Payouts',
        icon: 'bi bi-cash-stack',
        permission: 'settlements-payouts',
        isOpen: false,
        children: []
      },
      {
        title: 'Analytics & Reports',
        icon: 'bi bi-graph-up',
        permission: 'analytics-reports',
        isOpen: false,
        children: []
      },
      {
        title: 'System Configuration',
        icon: 'bi bi-gear',
        permission: 'system-config',
        isOpen: false,
        children: []
      },
      {
        title: 'System Management',
        icon: 'bi bi-person-badge',
        permission: 'system-management',
        isOpen: false,
        children: []
      },
      {
        title: 'Monitoring & Logs',
        icon: 'bi bi-clipboard-data',
        permission: 'monitoring-logs',
        isOpen: false,
        children: []
      }
    ];
  }

  private filterMenuItems(permissions: string[]): void {
    this.menuGroups.forEach(group => {
      group.children = this.allMenuItems.filter(item => 
        item.parentModule === group.permission && permissions.includes(item.permission)
      );
    });
    
    // Remove groups with no children
    this.menuGroups = this.menuGroups.filter(group => group.children.length > 0);
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

  toggleSubmenu(group: MenuGroup, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!this.isCollapsed) {
      group.isOpen = !group.isOpen;
    }
  }

  isGroupActive(group: MenuGroup): boolean {
    return group.children.some(child => this.router.isActive(child.path, true));
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.store.dispatch(new Logout());
    }
  }
}