// admin-payout-approval-rules.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PayoutApprovalRule,
  PayoutApprovalRuleFilters,
  PayoutApprovalRuleListResponse,
  CreatePayoutApprovalRulePayload,
  UpdatePayoutApprovalRulePayload,
  EnableDisableResponse
} from './admin-payout-approval-rules.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminPayoutApprovalRulesService {
  private baseUrl = 'https://doronpay.com/api/payout-approval-rules';

  constructor(private http: HttpClient) {}

  /**
   * List payout approval rules
   */
  listRules(filters?: PayoutApprovalRuleFilters): Observable<PayoutApprovalRuleListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.rail) params = params.set('rail', filters.rail);
      if (filters.transactionType) params = params.set('transactionType', filters.transactionType);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }
    
    return this.http.get<PayoutApprovalRuleListResponse>(`${this.baseUrl}/list`, { params });
  }

  /**
   * Create a new payout approval rule
   */
  createRule(payload: CreatePayoutApprovalRulePayload): Observable<{ success: boolean; data: PayoutApprovalRule }> {
    return this.http.post<{ success: boolean; data: PayoutApprovalRule }>(`${this.baseUrl}/create`, payload);
  }

  /**
   * Get rule by ID
   */
  getRuleById(ruleId: string): Observable<{ success: boolean; data: PayoutApprovalRule }> {
    return this.http.get<{ success: boolean; data: PayoutApprovalRule }>(`${this.baseUrl}/${ruleId}`);
  }

  /**
   * Update payout approval rule
   */
  updateRule(ruleId: string, payload: UpdatePayoutApprovalRulePayload): Observable<{ success: boolean; data: PayoutApprovalRule }> {
    return this.http.put<{ success: boolean; data: PayoutApprovalRule }>(`${this.baseUrl}/${ruleId}`, payload);
  }

  /**
   * Enable payout approval rule
   */
  enableRule(ruleId: string): Observable<EnableDisableResponse> {
    return this.http.post<EnableDisableResponse>(`${this.baseUrl}/${ruleId}/enable`, {});
  }

  /**
   * Disable payout approval rule
   */
  disableRule(ruleId: string): Observable<EnableDisableResponse> {
    return this.http.post<EnableDisableResponse>(`${this.baseUrl}/${ruleId}/disable`, {});
  }
}