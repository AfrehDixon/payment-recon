import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AdminLogin, AutoLogin, Logout } from './app.actions';
import { Navigate } from '@ngxs/router-plugin';
import { Injectable } from '@angular/core';
import { AdminService } from "../../service/admin.service";
import { Router } from '@angular/router';
import { PermissionService } from '../../service/permissions.service';
import { tap } from 'rxjs/operators';
import { InactivityTimeoutService } from '../../service/interactivity-timeout.service';

interface StateModel {
  user: any;
  token: string;
  refreshToken: string;
  error: any;
}

@State<StateModel>({
  name: 'auth',
  defaults: {
    user: null,
    token: '',
    refreshToken: '',
    error: null,
  },
})
@Injectable()
export class AuthState {
  @Selector()
  static user(state: StateModel) {
    return state.user;
  }

  @Selector()
  static token(state: StateModel) {
    return state.token;
  }

  @Selector()
  static refreshToken(state: StateModel) {
    return state.refreshToken;
  }

  @Selector()
  static error(state: StateModel) {
    return state.error;
  }

  @Selector()
  static permissions(state: StateModel) {
    return state.user?.permissions || [];
  }

  constructor(
    private service: AdminService, 
    private router: Router,
    private permissionService: PermissionService,
    private inactivityService: InactivityTimeoutService
  ) {}

  @Action(AutoLogin)
  autoLogin({ dispatch }: StateContext<StateModel>) {
    try {
      const session = localStorage.getItem('PLOGIN');
      if (typeof session !== 'string') {
        throw Error('LOGIN NOT FOUND');
      }
      const logins = JSON.parse(session);
      return dispatch(new AdminLogin(logins));
    } catch (err) {
      console.error('AutoLogin error:', err);
      return;
    }
  }

  @Action(AdminLogin)
  adminLogin(
    { patchState, dispatch }: StateContext<StateModel>,
    { payload }: AdminLogin
  ) {
    console.log('AdminLogin action executing with payload:', payload);
    
    // Ensure we're storing the refresh token as well
    const loginData = {
      user: payload.user,
      token: payload.token,
      refreshToken: payload.refreshToken
    };
    
    // Store in localStorage
    localStorage.setItem('PLOGIN', JSON.stringify(loginData));
    
    // Update state
    patchState({
      user: payload.user,
      token: payload.token,
      refreshToken: payload.refreshToken
    });
  
    // Update permissions in the permission service
    if (payload.user && payload.user.permissions) {
      this.permissionService.setPermissions(payload.user.permissions);
    }

    this.inactivityService.startMonitoring();
  
    return ;
  }

  @Action(Logout)
  logout({ patchState }: StateContext<StateModel>) {
    console.log('Logout action executing');
    this.inactivityService.stopMonitoring();

    
    // Clear permissions
    this.permissionService.clearPermissions();
    
    // Clear localStorage
    localStorage.removeItem('PLOGIN');
    
    // Reset state
    patchState({
      user: null,
      token: '',
      refreshToken: '',
      error: null
    });
    
    // Navigate to login page
    return this.router.navigate(['/auth/login']);
  }

  /**
   * Navigate to the appropriate page based on user permissions
   */
  private navigateBasedOnPermissions(permissions: string[]) {
    // Define the order of pages to check for permissions
    const pagePermissionMapping = [
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
    const firstAccessiblePage = pagePermissionMapping.find(page => 
      permissions.includes(page.permission)
    );

    if (firstAccessiblePage) {
      this.router.navigate([`/${firstAccessiblePage.path}`]);
    } else {
      // If no permissions match, redirect to a default page
      this.router.navigate(['/']);
    }
  }
}