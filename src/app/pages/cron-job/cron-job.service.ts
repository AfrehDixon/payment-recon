// cron-job.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CronJob,
  CronJobListResponse,
  CronJobActionResponse,
  CronJobConfigUpdate
} from './cron-job.interface';

@Injectable({
  providedIn: 'root',
})
export class CronJobService {
  private baseUrl = 'https://doronpay.com/api/cron-jobs/admin/cron-jobs';

  constructor(private http: HttpClient) {}

  /**
   * Get all cron jobs with their status
   */
  getCronJobs(): Observable<CronJobListResponse> {
    console.log('Fetching cron jobs');
    return this.http.get<CronJobListResponse>(`${this.baseUrl}`);
  }

  /**
   * Start a cron job
   */
  startJob(name: string, updatedBy?: string): Observable<CronJobActionResponse> {
    return this.http.post<CronJobActionResponse>(
      `${this.baseUrl}/${name}/start`,
      { updatedBy }
    );
  }

  /**
   * Stop a cron job
   */
  stopJob(name: string, updatedBy?: string): Observable<CronJobActionResponse> {
    return this.http.post<CronJobActionResponse>(
      `${this.baseUrl}/${name}/stop`,
      { updatedBy }
    );
  }

  /**
   * Restart a cron job
   */
  restartJob(name: string, updatedBy?: string): Observable<CronJobActionResponse> {
    return this.http.post<CronJobActionResponse>(
      `${this.baseUrl}/${name}/restart`,
      { updatedBy }
    );
  }

  /**
   * Update cron job configuration
   */
  updateConfig(
    name: string,
    config: CronJobConfigUpdate
  ): Observable<CronJobActionResponse> {
    return this.http.patch<CronJobActionResponse>(
      `${this.baseUrl}/${name}/config`,
      config
    );
  }
}