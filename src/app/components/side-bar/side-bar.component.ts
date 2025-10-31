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
  permission: string; // Permission required to see this route
}

export const Routes: RouteInfo[] = [
  { path: 'mechant', title: 'Merchants', class: 'false', permission: 'can view merchants module' },
  { path: 'admins', title: 'Admins', class: 'false', permission: 'can view admins module' },
  { path: 'reports', title: 'Reports', class: 'false', permission: 'can view reports module' },
  { path: 'wallets', title: 'Wallets', class: 'false', permission: 'can view wallets module' },
  { path: 'settlements', title: 'Merchant Collections', class: 'false', permission: 'can view merchant collections module' },
  { path: 'hub', title: "Hub", class: 'false', permission: 'can view hub module' },
  { path: 'queues', title: "Queues", class: 'false', permission: 'can view queues module' },
  { path: 'credit-debit', title: "Credit/Debit", class: 'false', permission: 'can view credit/debit module' },
  { path: 'transactions', title: "Transactions Filters", class: 'false', permission: 'can view transaction filters module' },
  { path: 'operator-config', title: "Operator Config", class: 'false', permission: 'can view operator config module' },
  { path: 'velocity-rules', title: "Velocity Rules", class: 'false', permission: 'can view velocity rules module' },
  { path: 'terminals', title: "Payment Terminals", class: 'false', permission: 'can view payment terminals module' },
  { path: 'charge-config', title: "Charge Config", class: 'false', permission: 'can view charge config module' },
  { path: 'merchant-tiers', title: "Merchant Tiers", class: 'false', permission: 'can view merchant tier module' },
  { path: 'daily-statistics', title: "Daily Statistics", class: 'false', permission: 'can view daily statistics module' },
  { path: 'weekly-statistics', title: "Weekly Statistics", class: 'false', permission: 'can view weekly statistics module' },
  { path: 'monthly-statistics', title: "Monthly Statistics", class: 'false', permission: 'can view monthly statistics module' },
  { path: 'cummulative-statistics', title: "Cummulative Statistics", class: 'false', permission: 'can view cumulative statistics module' },
  { path: 'logs', title: "System Logs", class: 'false', permission: 'can view system logs module' },
  { path: 'logs-summary', title: "Logs Summary", class: 'false', permission: 'can view logs summary module' },
  { path: 'payout-recon', title: "Payout Reconciliation", class: 'false', permission: 'can view payout reconciliation module' },
  { path: 'payout-issues', title: "Payout Issues", class: 'false', permission: 'can view payout issues module' },
  { path: 'operator-switch', title: "Operator Switch", class: 'false', permission: 'can view operator switch module' },
  { path: 'valut-config', title: "Vault Management", class: 'false', permission: 'can view operator switch module'},
  { path: 'reversals', title: "Reversals", class: 'false', permission: 'can view operator switch module'},
  { path: 'merchant-statistics', title: "Merchant Statistics", class: 'false', permission: 'can view merchant statistics module' },
  { path: 'balance-history', title: "Merchant Balance History", class: 'false', permission: 'can view merchant balance history module' },
  { path: 'balance-summary', title: "Merchant Balance Summary", class: 'false', permission: 'can view merchant balance summary module' },
  { path: 'payment-links', title: "Payment Links", class: 'false', permission: 'can view payment links module' },
  { path: 'account-blacklist', title: "Account Blacklist", class: 'false', permission: 'can view account blacklist module' },
  { path: 'settings', title: "System Settings", class: 'false', permission: 'can view system settings module' },
  { path: 'permission-management', title: "Permission Management", class: 'false', permission: 'can view system settings module' },
  { path: 'tickets', title: "Admin Ticket Management", class: 'false', permission: 'can view admins module' },
  { path: 'card-wallets', title: "Customer Wallets", class: 'false', permission: 'can view admins module' },
  { path: 'consolidations', title: "Consolidations", class: 'false', permission: 'can view admins module' },
  { path: 'deposit-addresses', title: "Deposit Addresses", class: 'false', permission: 'can view admins module' },
  { path: 'trx-transfer', title: "Transaction Transfer", class: 'false', permission: 'can view admins module' }
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
    
    // Add a null check before subscribing
    if (this.user$) {
      this.userSubscription = this.user$.subscribe((user: any) => {
        if (user) {
          this.user_name = user.name || 'User';
        }
      });
    }
    
    // Initialize user name from localStorage if available
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
    
    // Subscribe to permission changes
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
    // Filter menu items based on user permissions
    this.menuItems = this.allMenuItems.filter(item => 
      permissions.includes(item.permission)
    );
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

  getMenuIcon(path: string): string {
    const iconMap: { [key: string]: string } = {
      'mechant': 'bi bi-speedometer2',
      'payment-reconciliation': 'bi bi-bar-chart',
      'admins': 'bi bi-person',
      'reports': 'bi bi-file-earmark-text',
      'permission-management': 'bi bi-shield-lock',
      'credit-debit': 'bi bi-credit-card',
      'settlements': 'bi bi-file-earmark-text',
      'terminals': 'bi bi-credit-card',
      'trx-transfer': 'fas fa-exchange-alt',
      'velocity-rules': 'bi bi-shield-lock',
      'wallets': 'bi bi-wallet',
      'hub': 'bi bi-house-door',
      'tickets': 'bi bi-ticket-perforated',
      'deposit-addresses': 'bi bi-house-door',
      'queues': 'bi bi-list',
      'transactions': 'bi bi-cash',
      'valut-config': 'bi bi-lock',
      'reversals': 'bi bi-arrow-counterclockwise',
      'settings': 'bi bi-gear',
      'operator-config': 'bi bi-tools',
      'charge-config': 'bi bi-calculator',
      'merchant-tiers': 'bi bi-layers',
      'daily-statistics': 'bi bi-calendar',
      'weekly-statistics': 'bi bi-calendar',
      'monthly-statistics': 'bi bi-calendar',
      'cummulative-statistics': 'bi bi-calendar',
      'logs': 'bi bi-journal',
      'logs-summary': 'bi bi-journal',
      'payout-reconciliation': 'bi bi-calculator',
      'operator-switch': 'bi bi-arrow-repeat',
      'payout-issues': 'bi bi-exclamation-circle', 
      'merchant-statistics': 'bi bi-bar-chart-line',
      'balance-history': 'bi bi-graph-up',
      'balance-summary': 'bi bi-graph-up',
      'payment-links': 'bi bi-link-45deg',
      'account-blacklist': 'bi bi-shield-lock',
      'card-wallets': 'bi bi-credit-card-2-back',
      'consolidations': 'bi bi-shuffle'
    };

    return iconMap[path] || 'bi bi-circle';
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.store.dispatch(new Logout());
    }
  }
}