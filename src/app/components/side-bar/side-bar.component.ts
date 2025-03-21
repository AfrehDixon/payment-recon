import { Component, OnInit } from '@angular/core';
import { Logout } from '../../auth/auth.action';
import { Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface RouteInfo {
  class: string | string[] | Set<string> | { [klass: string]: any; } | null | undefined;
  path: string;
  title: string;
}

export const Routes: RouteInfo[] = [
  { path: 'mechant', title: 'Mechant', class: 'false' },
  { path: 'admins', title: 'Admins', class: 'false'},
  { path: 'reports', title: 'Reports', class: 'false' },
  { path: 'wallets', title: 'Wallets', class: 'false' },
  { path: 'hub', title: "Hub", class: 'false' },
  { path: 'queues', title: "Queues", class: 'false' },
  { path: 'transactions', title: "Transactions Filters", class: 'false' },
  { path: 'operator-config', title: "Operator Config", class: 'false' },
  { path: 'charge-config', title: "Charge Config", class: 'false' },
  { path: 'merchant-tiers', title: "Merchant Tiers", class: 'false' },
  { path: 'daily-statistics', title: "Daily Statistics", class: 'false' },
  { path: 'weekly-statistics', title: "Weekly Statistics", class: 'false' },
  {  path: 'monthly-statistics', title: "Monthly Statistics", class: 'false' },
  { path: 'cummulative-statistics', title: "Cummulative Statistics", class: 'false' },
  { path: 'logs', title: "System Logs", class: 'false' },
  { path: 'logs-summary', title: "Logs Summary", class: 'false' },
  { path: 'payout-recon', title: "Payout Reconciliation", class: 'false' },
  { path: 'payout-issues', title: "Payout Issues", class: 'false' },
  { path: 'operator-switch', title: "Operator Switch", class: 'false' },
  { path: 'merchant-statistics', title: "Merchant Statistics", class: 'false' },
  { path: 'balance-history', title: "Merchant Balance History", class: 'false' },
  { path: 'balance-summary', title: "Merchant Balance Summary", class: 'false' },
  { path: 'payment-links', title: "Payment Links", class: 'false' },
  // { path: 'payment-reconciliation', title: 'Payment Reconciliation', class: 'red' },
  { path: 'settings', title: "System Settings", class: 'false' },


];

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SidebarComponent implements OnInit {
  logo: string = "";
  menuItems: RouteInfo[] = Routes;
  user_permissions: string[] = ['Admin']; // Example permissions
  user_name: string = "John Doe"; // Example user name
  isCollapsed: boolean = false;
  isMobile: boolean = false;

  constructor(
    private store: Store,
    public router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.setupEventListeners();
    this.menuItems = this.filterMenuItems(Routes);
  }

  private filterMenuItems(routes: RouteInfo[]): RouteInfo[] {
    let filteredItems = [...routes];
    const isAdmin = this.user_permissions.includes('Super Admin') || this.user_permissions.includes('Admin');
    const isApprover = this.user_permissions.includes('Approver');

    if (!isAdmin) {
      filteredItems.splice(0, 1);
      if (!isApprover) {
        filteredItems = filteredItems.filter(item => item.path !== 'authorize');
      } else {
        filteredItems = filteredItems.filter(item => item.path !== 'single-pay');
      }
    }

    return filteredItems;
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
      'wallets': 'bi bi-wallet',
      'hub': 'bi bi-house-door',
      'queues': 'bi bi-list',
      'transactions': 'bi bi-cash',
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
    };

    return iconMap[path] || 'bi bi-circle';
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.store.dispatch(new Logout());
      this.router.navigate(['/login']);
    }
  }
}