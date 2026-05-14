// admin-payout-approval-rules.interface.ts
export interface PayoutApprovalRule {
  _id: string;
  name: string;
  description?: string;
  priority: number;
  status: 'ACTIVE' | 'INACTIVE';
  rail: 'FIAT' | 'CRYPTO';
  transactionType: 'DEBIT' | 'CREDIT' | 'BOTH';
  amountGreaterThanOrEqual?: number;
  amountLessThanOrEqual?: number;
  currency?: string;
  asset?: string;
  network?: string;
  approverRoles: string[];
  requiredApprovals: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface PayoutApprovalRuleFilters {
  status?: string;
  rail?: string;
  transactionType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PayoutApprovalRuleListResponse {
  success: boolean;
  code?: string;
  message?: string;
  data: PayoutApprovalRule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  requestId?: string;
}

export interface CreatePayoutApprovalRulePayload {
  name: string;
  description?: string;
  priority: number;
  rail: 'FIAT' | 'CRYPTO';
  transactionType: 'DEBIT' | 'CREDIT' | 'BOTH';
  amountGreaterThanOrEqual?: number;
  amountLessThanOrEqual?: number;
  currency?: string;
  asset?: string;
  network?: string;
  approverRoles: string[];
  requiredApprovals: number;
}

export interface UpdatePayoutApprovalRulePayload {
  name?: string;
  description?: string;
  priority?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  amountGreaterThanOrEqual?: number;
  amountLessThanOrEqual?: number;
  currency?: string;
  asset?: string;
  network?: string;
  approverRoles?: string[];
  requiredApprovals?: number;
}

export interface EnableDisableResponse {
  success: boolean;
  code?: string;
  message: string;
  data: PayoutApprovalRule;
}