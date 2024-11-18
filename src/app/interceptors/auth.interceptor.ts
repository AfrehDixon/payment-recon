import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpEvent,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest
} from '@angular/common/http';
import { Store } from '@ngxs/store';
import { AuthState } from '../state/apps/app.states';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Logout } from '../auth/auth.action';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const store = inject(Store);

  // Skip interceptor for login/refresh endpoints if needed
  if (req.url.includes('login') || req.url.includes('refresh')) {
    return next(req);
  }

  const token = store.selectSnapshot(AuthState.token);
  
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    });

    return next(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Handle 401 Unauthorized
          store.dispatch(new Logout());
          return throwError(() => new Error('Session expired. Please login again.'));
        }
        
        // Handle other errors
        const errorMsg = getErrorMessage(error);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  return next(req);
};

function getErrorMessage(error: HttpErrorResponse): string {
  if (error.error instanceof ErrorEvent) {
    // Client-side error
    return `Client Error: ${error.error.message}`;
  }
  // Server-side error
  return error.status === 0 
    ? 'Network error. Please check your connection.'
    : `Server Error: ${error.status} ${error.message}`;
}