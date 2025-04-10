import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpEvent,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
  HttpClient
} from '@angular/common/http';
import { Store } from '@ngxs/store';
import { AuthState } from '../state/apps/app.states';
import { catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { AdminLogin, Logout } from '../state/apps/app.actions';

// Track refresh token process
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const store = inject(Store);
  const http = inject(HttpClient);

  // Skip interceptor for login endpoint
  if (req.url.includes('login')) {
    return next(req);
  }

  const token = store.selectSnapshot(AuthState.token);
  
  if (token) {
    req = addTokenToRequest(req, token);

    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return handleUnauthorizedError(req, next, store, http);
        }
        
        // Handle other errors
        const errorMsg = getErrorMessage(error);
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  return next(req);
};

function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  });
}

function handleUnauthorizedError(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  store: Store,
  http: HttpClient
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    // Get the refresh token from local storage
    const storedData = localStorage.getItem('PLOGIN');
    if (!storedData) {
      // No refresh token available, log out
      store.dispatch(new Logout());
      return throwError(() => new Error('Session expired. Please login again.'));
    }

    const userData = JSON.parse(storedData);
    const refreshToken = userData.refreshToken;

    if (!refreshToken) {
      // No refresh token available, log out
      store.dispatch(new Logout());
      return throwError(() => new Error('Session expired. Please login again.'));
    }

    return http.post<any>('https://doronpay.com/api/refreshtokens/refresh', { refreshToken }).pipe(
      switchMap(response => {
        isRefreshing = false;
        
        if (response.success) {
          // Store the new token and data
          const newUserData = {
            user: response.data,
            token: response.token,
            refreshToken: response.refreshToken
          };
          
          store.dispatch(new AdminLogin(newUserData));
          refreshTokenSubject.next(response.token);
          
          // Retry the original request with the new token
          return next(addTokenToRequest(request, response.token));
        } else {
          // Refresh token failed
          store.dispatch(new Logout());
          return throwError(() => new Error('Session expired. Please login again.'));
        }
      }),
      catchError(error => {
        isRefreshing = false;
        store.dispatch(new Logout());
        return throwError(() => new Error('Session expired. Please login again.'));
      })
    );
  } else {
    // Wait for token to be refreshed
    return refreshTokenSubject.pipe(
      switchMap(token => {
        if (token) {
          return next(addTokenToRequest(request, token));
        } else {
          return throwError(() => new Error('Session expired. Please login again.'));
        }
      })
    );
  }
}

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