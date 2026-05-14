// admin-payout-approval-rules.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  PayoutApprovalRule,
  PayoutApprovalRuleFilters,
  CreatePayoutApprovalRulePayload,
  UpdatePayoutApprovalRulePayload
} from './admin-payout-approval-rules.interface';
import { AdminPayoutApprovalRulesService } from './admin-payout-approval-rules.service';

@Component({
  selector: 'app-admin-payout-approval-rules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-payout-approval-rules.component.html',
  styleUrls: ['./admin-payout-approval-rules.component.scss']
})
export class AdminPayoutApprovalRulesComponent implements OnInit, OnDestroy {
  // Data
  rules: PayoutApprovalRule[] = [];
  selectedRule: PayoutApprovalRule | null = null;
  Math = Math;
  
  // Forms
  filterForm!: FormGroup;
  ruleForm!: FormGroup;
  
  // UI State
  loading = false;
  showFilters = false;
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  showConfirmModal = false;
  confirmAction: 'enable' | 'disable' | null = null;
  pendingRule: PayoutApprovalRule | null = null;
  actionInProgress = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];
  
  // Filters state
  statusOptions = ['ACTIVE', 'INACTIVE'];
  railOptions = ['FIAT', 'CRYPTO'];
  transactionTypeOptions = ['DEBIT', 'CREDIT', 'BOTH'];
  roleOptions = [
    'COMPLIANCE_OFFICER',
    'FINANCE_ADMIN',
    'RISK_MANAGER',
    'OPERATIONS_MANAGER',
    'HEAD_OF_FINANCE',
    'CEO',
    'CFO'
  ];
  
  // Computed properties for stats
  get activeRulesCount(): number {
    return this.rules.filter(r => r.status === 'ACTIVE').length;
  }

  get inactiveRulesCount(): number {
    return this.rules.filter(r => r.status === 'INACTIVE').length;
  }
  
  get fiatRulesCount(): number {
    return this.rules.filter(r => r.rail === 'FIAT').length;
  }
  
  get cryptoRulesCount(): number {
    return this.rules.filter(r => r.rail === 'CRYPTO').length;
  }
  
  // Destroy subject
  private destroy$ = new Subject<void>();
  
  // Current admin user
  currentAdmin = 'admin@doronpay.com';
  
  constructor(
    private fb: FormBuilder,
    private service: AdminPayoutApprovalRulesService
  ) {
    this.initFilterForm();
    this.initRuleForm();
  }
  
  ngOnInit() {
    this.loadRules();
    this.setupFilterSubscriptions();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initFilterForm() {
    this.filterForm = this.fb.group({
      status: [''],
      rail: [''],
      transactionType: [''],
      search: ['']
    });
  }
  
  private initRuleForm() {
    this.ruleForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      priority: [100, [Validators.required, Validators.min(1), Validators.max(999)]],
      rail: ['CRYPTO', Validators.required],
      transactionType: ['DEBIT', Validators.required],
      amountGreaterThanOrEqual: [null],
      amountLessThanOrEqual: [null],
      currency: [''],
      asset: [''],
      network: [''],
      approverRoles: [[], Validators.required],
      requiredApprovals: [1, [Validators.required, Validators.min(1)]]
    });
  }
  
  private setupFilterSubscriptions() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadRules();
      });
  }
  
  loadRules() {
    this.loading = true;
    
    const filters: PayoutApprovalRuleFilters = {
      ...this.filterForm.value,
      page: this.currentPage,
      limit: this.pageSize
    };
    
    // Remove empty values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof PayoutApprovalRuleFilters] === '' || filters[key as keyof PayoutApprovalRuleFilters] === undefined) {
        delete filters[key as keyof PayoutApprovalRuleFilters];
      }
    });
    
    this.service.listRules(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.rules = response.data;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.pages;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading approval rules:', error);
          this.loading = false;
        }
      });
  }
  
  viewRuleDetails(rule: PayoutApprovalRule) {
    this.selectedRule = rule;
    this.showViewModal = true;
  }
  
  closeViewModal() {
    this.showViewModal = false;
    this.selectedRule = null;
  }
  
  openCreateModal() {
    this.resetRuleForm();
    this.showCreateModal = true;
  }
  
  openEditModal(rule: PayoutApprovalRule) {
    this.selectedRule = rule;
    this.populateRuleForm(rule);
    this.showEditModal = true;
  }
  
  resetRuleForm() {
    this.ruleForm.reset({
      name: '',
      description: '',
      priority: 100,
      rail: 'CRYPTO',
      transactionType: 'DEBIT',
      amountGreaterThanOrEqual: null,
      amountLessThanOrEqual: null,
      currency: '',
      asset: '',
      network: '',
      approverRoles: [],
      requiredApprovals: 1
    });
  }
  
  populateRuleForm(rule: PayoutApprovalRule) {
    this.ruleForm.patchValue({
      name: rule.name,
      description: rule.description || '',
      priority: rule.priority,
      rail: rule.rail,
      transactionType: rule.transactionType,
      amountGreaterThanOrEqual: rule.amountGreaterThanOrEqual || null,
      amountLessThanOrEqual: rule.amountLessThanOrEqual || null,
      currency: rule.currency || '',
      asset: rule.asset || '',
      network: rule.network || '',
      approverRoles: rule.approverRoles,
      requiredApprovals: rule.requiredApprovals
    });
  }
  
  createRule() {
    if (this.ruleForm.invalid) {
      this.ruleForm.markAllAsTouched();
      return;
    }
    
    this.actionInProgress = true;
    const payload: CreatePayoutApprovalRulePayload = this.ruleForm.value;
    
    this.service.createRule(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeCreateModal();
          this.loadRules();
          this.actionInProgress = false;
        },
        error: (error) => {
          console.error('Error creating rule:', error);
          this.actionInProgress = false;
        }
      });
  }
  
  updateRule() {
    if (this.ruleForm.invalid || !this.selectedRule) {
      return;
    }
    
    this.actionInProgress = true;
    const payload: UpdatePayoutApprovalRulePayload = this.ruleForm.value;
    
    this.service.updateRule(this.selectedRule._id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadRules();
          this.actionInProgress = false;
        },
        error: (error) => {
          console.error('Error updating rule:', error);
          this.actionInProgress = false;
        }
      });
  }
  
  closeCreateModal() {
    this.showCreateModal = false;
    this.resetRuleForm();
  }
  
  closeEditModal() {
    this.showEditModal = false;
    this.selectedRule = null;
    this.resetRuleForm();
  }
  
  confirmToggleStatus(rule: PayoutApprovalRule, action: 'enable' | 'disable') {
    this.pendingRule = rule;
    this.confirmAction = action;
    this.showConfirmModal = true;
  }
  
  executeStatusToggle() {
    if (!this.pendingRule || !this.confirmAction) return;
    
    this.actionInProgress = true;
    this.showConfirmModal = false;
    
    const action = this.confirmAction === 'enable' 
      ? this.service.enableRule(this.pendingRule._id)
      : this.service.disableRule(this.pendingRule._id);
    
    action.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadRules();
          this.actionInProgress = false;
          this.pendingRule = null;
          this.confirmAction = null;
        },
        error: (error) => {
          console.error(`Error ${this.confirmAction}ing rule:`, error);
          this.actionInProgress = false;
        }
      });
  }
  
  cancelConfirm() {
    this.showConfirmModal = false;
    this.pendingRule = null;
    this.confirmAction = null;
  }
  
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters() {
    this.filterForm.reset({
      status: '',
      rail: '',
      transactionType: '',
      search: ''
    });
    this.currentPage = 1;
    this.loadRules();
  }
  
  addRole(role: string) {
    const currentRoles = this.ruleForm.get('approverRoles')?.value || [];
    if (!currentRoles.includes(role)) {
      this.ruleForm.patchValue({ approverRoles: [...currentRoles, role] });
    }
  }
  
  removeRole(role: string) {
    const currentRoles = this.ruleForm.get('approverRoles')?.value || [];
    this.ruleForm.patchValue({ approverRoles: currentRoles.filter((r: string) => r !== role) });
  }
  
  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRules();
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRules();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRules();
    }
  }
  
  changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadRules();
  }
  
  // Helper methods
  getStatusClass(status: string): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }
  
  getStatusIcon(status: string): string {
    return status === 'ACTIVE' ? 'fa-check-circle' : 'fa-pause-circle';
  }
  
  getRailClass(rail: string): string {
    return rail === 'FIAT' ? 'rail-fiat' : 'rail-crypto';
  }
  
  getRailIcon(rail: string): string {
    return rail === 'FIAT' ? 'fa-money-bill-wave' : 'fa-bitcoin';
  }
  
  formatAmount(value: number): string {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
  
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}