import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, merge, Subject, Subscription, timer } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { Logout } from '../state/apps/app.actions';

@Injectable({
  providedIn: 'root'
})
export class InactivityTimeoutService implements OnDestroy {
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
  private readonly DEBOUNCE_TIME = 500; // 500ms debounce to prevent excessive timer resets
  
  private activitySubscription: Subscription | null = null;
  private timeoutSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();
  private timeoutTimer$ = new Subject<void>();

  constructor(private store: Store) {}

  /**
   * Start monitoring user activity and setup the inactivity timeout
   */
  startMonitoring(): void {
    console.log('Starting inactivity monitoring');
    this.stopMonitoring(); // Clear any existing subscriptions
    this.setupActivityListeners();
    this.resetInactivityTimer();
  }

  /**
   * Stop monitoring user activity and clear all subscriptions
   */
  stopMonitoring(): void {
    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = null;
    }

    if (this.timeoutSubscription) {
      this.timeoutSubscription.unsubscribe();
      this.timeoutSubscription = null;
    }

    this.timeoutTimer$.next();
  }

  /**
   * Setup event listeners for various user activities
   */
  private setupActivityListeners(): void {
    // Creates an array of observables for different user activities
    const userActivityObservables = [
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'scroll'),
      fromEvent(window, 'resize')
    ];

    // Combine all user activity observables
    this.activitySubscription = merge(...userActivityObservables).pipe(
      debounceTime(this.DEBOUNCE_TIME),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.resetInactivityTimer();
    });
  }

  /**
   * Reset the inactivity timer whenever user activity is detected
   */
  private resetInactivityTimer(): void {
    // Cancel the previous timer
    this.timeoutTimer$.next();
    
    // Create a new timer
    this.timeoutSubscription = timer(this.INACTIVITY_TIMEOUT)
      .pipe(takeUntil(this.timeoutTimer$))
      .subscribe(() => {
        console.log('User inactive for 15 minutes, logging out');
        this.logoutInactiveUser();
      });
  }

  /**
   * Logs out the user due to inactivity
   */
  private logoutInactiveUser(): void {
    this.store.dispatch(new Logout());
  }

  /**
   * Clean up subscriptions when service is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timeoutTimer$.next();
    this.timeoutTimer$.complete();
    this.stopMonitoring();
  }
}