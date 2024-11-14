// guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthState } from '../state/apps/app.states';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private store: Store,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = this.store.selectSnapshot(AuthState.token);
    if (token) {
      return true;
    }
    
    this.router.navigate(['/auth/login']);
    return false;
  }
}