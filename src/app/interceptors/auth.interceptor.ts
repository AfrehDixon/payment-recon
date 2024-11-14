import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Store } from '@ngxs/store';
import { AuthState } from '../state/apps/app.states';
import { catchError, map } from 'rxjs/operators';
// import Logout  from '../state/apps/app.states';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private store: Store) {}
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.store.selectSnapshot(AuthState.token);
    console.log(token);
    req = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      }
    });
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          // this.store.dispatch(new Logout());
        }
        return throwError('Token expired');
      })
    );
  }
}
