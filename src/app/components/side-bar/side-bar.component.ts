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
  { path: 'payment-reconciliation', title: 'Payment Reconciliation', class: 'red' },
  { path: 'mechant', title: 'Mechant', class: 'false' },
  { path: 'admins', title: 'Admins', class: 'false'},
  { path: 'reports', title: 'Reports', class: 'false' },
  { path: 'wallets', title: 'Wallets', class: 'false' },
  { path: 'hub', title: "Hub", class: 'false' },
  { path: 'queues', title: "Queues", class: 'false' },
  { path: 'transactions', title: "Transactions Filters", class: 'false' }

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

    // 'dashboard': 'bi bi-bar-chart',
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