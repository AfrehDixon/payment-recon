import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AuthState } from '../../state/apps/app.states';

interface VelocityRule {
  timeWindowMinutes: number;
  maxTransactions: number;
  minAmount: number;
  maxAmount?: number;
  severity: 'low' | 'medium' | 'high';
}

interface VelocityRuleConfig {
  _id: string;
  accountType: 'MOMO' | 'CARD' | 'BANK' | 'DEFAULT' | 'OTHERS';
  rules: VelocityRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-velocity-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen p-6" style="margin-left: 200px;">
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <h1 class="text-2xl font-bold text-gray-900">Velocity Rules Management</h1>
          <p class="text-gray-500">Configure transaction velocity rules for fraud prevention</p>
        </div>

        <!-- Loading State -->
        <div class="flex justify-center items-center h-64" *ngIf="loading">
          <div
            class="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"
          ></div>
        </div>

        <!-- Error Message -->
        <div class="p-4 text-red-600 bg-red-50 rounded-lg" *ngIf="error">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div class="p-4 text-green-600 bg-green-50 rounded-lg" *ngIf="successMessage">
          {{ successMessage }}
        </div>

        <!-- Active Rules -->
        <div *ngIf="!loading && !showRuleForm">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-gray-900">Active Velocity Rules</h2>
              <button
                (click)="createNewRule()"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create New Rule
              </button>
            </div>

            <!-- No Rules Message -->
            <div *ngIf="velocityConfigs.length === 0" class="text-center py-10">
              <i class="material-icons text-4xl text-gray-400">rule</i>
              <p class="mt-2 text-gray-500">No velocity rules configured yet</p>
              <button
                (click)="createNewRule()"
                class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Your First Rule
              </button>
            </div>

            <!-- Rules by Account Type -->
            <div *ngIf="velocityConfigs.length > 0" class="space-y-6">
              <div *ngFor="let config of velocityConfigs" class="border rounded-lg overflow-hidden">
                <div class="bg-gray-50 p-4 flex justify-between items-center">
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ config.accountType }} Rules</h3>
                    <p class="text-sm text-gray-500">Last updated: {{ formatDate(config.updatedAt) }}</p>
                  </div>
                  <div class="flex space-x-2">
                    <button
                      (click)="editRules(config)"
                      class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      (click)="disableRules(config.accountType)"
                      class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                      [disabled]="actionInProgress"
                    >
                      <span *ngIf="!actionInProgress || actionTypeInProgress !== config.accountType">Disable</span>
                      <span *ngIf="actionInProgress && actionTypeInProgress === config.accountType">
                        <i class="material-icons animate-spin text-xs">refresh</i>
                      </span>
                    </button>
                  </div>
                </div>
                <div class="p-4">
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time Window
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Max Transactions
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Min Amount
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Max Amount
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Severity
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <tr *ngFor="let rule of config.rules">
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ rule.timeWindowMinutes }} minutes
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ rule.maxTransactions }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ formatCurrency(rule.minAmount) }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ rule.maxAmount ? formatCurrency(rule.maxAmount) : 'No limit' }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span
                              class="px-2 py-1 text-xs font-medium rounded-full"
                              [class.bg-yellow-100]="rule.severity === 'low'"
                              [class.text-yellow-800]="rule.severity === 'low'"
                              [class.bg-orange-100]="rule.severity === 'medium'"
                              [class.text-orange-800]="rule.severity === 'medium'"
                              [class.bg-red-100]="rule.severity === 'high'"
                              [class.text-red-800]="rule.severity === 'high'"
                            >
                              {{ rule.severity }}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rule Form -->
        <div *ngIf="showRuleForm" class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ isEditMode ? 'Edit' : 'Create' }} Velocity Rules for {{ ruleForm.get('accountType')?.value }}
            </h2>
            <button
              (click)="cancelForm()"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>

          <form [formGroup]="ruleForm" (ngSubmit)="submitRuleForm()">
            <!-- Account Type Selection -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <select
                formControlName="accountType"
                class="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                [disabled]="isEditMode"
              >
                <option value="MOMO">Mobile Money (MOMO)</option>
                <option value="CARD">Card Payments</option>
                <option value="BANK">Bank Transfers</option>
                <option value="DEFAULT">Default Rules</option>
                <option value="OTHERS">Other Payment Methods</option>
              </select>
            </div>

            <!-- Rules Section -->
            <div formArrayName="rules" class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Rules</h3>
                <button
                  type="button"
                  (click)="addRule()"
                  class="text-blue-600 hover:text-blue-800"
                >
                  <i class="material-icons">add_circle</i> Add Rule
                </button>
              </div>

              <div *ngIf="rulesFormArray.length === 0" class="text-center py-4 border border-dashed border-gray-300 rounded-md">
                <p class="text-gray-500">No rules added yet. Click "Add Rule" to get started.</p>
              </div>

              <div
                *ngFor="let ruleControl of rulesFormArray.controls; let i = index"
                [formGroupName]="i"
                class="p-4 mb-4 border rounded-md bg-gray-50"
              >
                <div class="flex justify-between items-center mb-4">
                  <h4 class="font-medium text-gray-900">Rule #{{ i + 1 }}</h4>
                  <button
                    type="button"
                    (click)="removeRule(i)"
                    class="text-red-600 hover:text-red-800"
                  >
                    <i class="material-icons">delete</i>
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Time Window -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Time Window (minutes)</label>
                    <input
                      type="number"
                      formControlName="timeWindowMinutes"
                      class="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                    <div *ngIf="ruleControl.get('timeWindowMinutes')?.invalid && ruleControl.get('timeWindowMinutes')?.touched" class="mt-1 text-red-500 text-sm">
                      Time window must be at least 1 minute
                    </div>
                  </div>

                  <!-- Max Transactions -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Max Transactions</label>
                    <input
                      type="number"
                      formControlName="maxTransactions"
                      class="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                    <div *ngIf="ruleControl.get('maxTransactions')?.invalid && ruleControl.get('maxTransactions')?.touched" class="mt-1 text-red-500 text-sm">
                      Max transactions must be at least 1
                    </div>
                  </div>

                  <!-- Min Amount -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Min Amount (GHS)</label>
                    <input
                      type="number"
                      formControlName="minAmount"
                      class="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                    <div *ngIf="ruleControl.get('minAmount')?.invalid && ruleControl.get('minAmount')?.touched" class="mt-1 text-red-500 text-sm">
                      Min amount must be at least 0
                    </div>
                  </div>

                  <!-- Max Amount (Optional) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Max Amount (GHS, optional)</label>
                    <input
                      type="number"
                      formControlName="maxAmount"
                      class="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      placeholder="No limit"
                    />
                    <div *ngIf="ruleControl.get('maxAmount')?.invalid && ruleControl.get('maxAmount')?.touched" class="mt-1 text-red-500 text-sm">
                      Max amount must be at least 0
                    </div>
                  </div>

                  <!-- Severity -->
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                    <div class="flex space-x-4">
                      <label class="inline-flex items-center">
                        <input type="radio" formControlName="severity" value="low" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span class="ml-2 text-sm text-gray-700">Low</span>
                      </label>
                      <label class="inline-flex items-center">
                        <input type="radio" formControlName="severity" value="medium" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span class="ml-2 text-sm text-gray-700">Medium</span>
                      </label>
                      <label class="inline-flex items-center">
                        <input type="radio" formControlName="severity" value="high" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <span class="ml-2 text-sm text-gray-700">High</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end">
              <button
                type="submit"
                [disabled]="ruleForm.invalid || isSubmitting || rulesFormArray.length === 0"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span *ngIf="!isSubmitting">
                  {{ isEditMode ? 'Update' : 'Create' }} Rules
                </span>
                <span *ngIf="isSubmitting" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./velocity-rules.component.scss'],
})
export class VelocityRulesComponent implements OnInit {
  velocityConfigs: VelocityRuleConfig[] = [];
  loading = false;
  error = '';
  successMessage = '';
  
  showRuleForm = false;
  isEditMode = false;
  isSubmitting = false;
  ruleForm!: FormGroup;
  
  actionInProgress = false;
  actionTypeInProgress = '';

  constructor(
    private http: HttpClient,
    private store: Store,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.fetchVelocityRules();
  }

  initializeForm() {
    this.ruleForm = this.fb.group({
      accountType: ['MOMO', Validators.required],
      rules: this.fb.array([])
    });
  }

  get rulesFormArray(): FormArray {
    return this.ruleForm.get('rules') as FormArray;
  }

  private getHeaders(): HttpHeaders {
    const token = this.store.selectSnapshot(AuthState.token);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  async fetchVelocityRules() {
    this.loading = true;
    this.error = '';

    try {
      const response = await this.http
        .get<any>(`https://doronpay.com/api/velocity-rules/get`, {
          headers: this.getHeaders(),
        })
        .toPromise();

      if (response) {
        this.velocityConfigs = response;
      } else {
        this.velocityConfigs = [];
      }
    } catch (err) {
      this.error = 'Failed to load velocity rules';
      console.error('Velocity rules fetch error:', err);
    } finally {
      this.loading = false;
    }
  }

  createNewRule() {
    this.isEditMode = false;
    this.showRuleForm = true;
    
    // Clear rules array
    while (this.rulesFormArray.length !== 0) {
      this.rulesFormArray.removeAt(0);
    }
    
    // Reset form
    this.ruleForm.patchValue({
      accountType: 'MOMO'
    });
    
    // Add default empty rule
    this.addRule();
  }

  editRules(config: VelocityRuleConfig) {
    this.isEditMode = true;
    this.showRuleForm = true;
    
    // Clear rules array
    while (this.rulesFormArray.length !== 0) {
      this.rulesFormArray.removeAt(0);
    }
    
    // Set account type
    this.ruleForm.patchValue({
      accountType: config.accountType
    });
    
    // Add each rule
    config.rules.forEach(rule => {
      this.addRule(rule);
    });
  }

  cancelForm() {
    this.showRuleForm = false;
    this.isEditMode = false;
  }

  addRule(rule?: VelocityRule) {
    const ruleGroup = this.fb.group({
      timeWindowMinutes: [rule?.timeWindowMinutes || 60, [Validators.required, Validators.min(1)]],
      maxTransactions: [rule?.maxTransactions || 5, [Validators.required, Validators.min(1)]],
      minAmount: [rule?.minAmount || 0, [Validators.required, Validators.min(0)]],
      maxAmount: [rule?.maxAmount || null, [Validators.min(0)]],
      severity: [rule?.severity || 'medium', Validators.required]
    });
    
    this.rulesFormArray.push(ruleGroup);
  }

  removeRule(index: number) {
    this.rulesFormArray.removeAt(index);
  }

  async submitRuleForm() {
    if (this.ruleForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      this.markFormGroupTouched(this.ruleForm);
      return;
    }
    
    if (this.rulesFormArray.length === 0) {
      this.error = 'At least one rule is required';
      return;
    }
    
    this.isSubmitting = true;
    this.error = '';
    this.successMessage = '';
    
    const accountType = this.ruleForm.get('accountType')?.value;
    const rules = this.ruleForm.get('rules')?.value;
    
    try {
      const response = await this.http
        .post<any>(
          `https://doronpay.com/api/velocity-rules/${accountType}`,
          rules,
          { headers: this.getHeaders() }
        )
        .toPromise();
      
      if (response) {
        this.successMessage = `Velocity rules for ${accountType} ${this.isEditMode ? 'updated' : 'created'} successfully!`;
        this.showRuleForm = false;
        this.fetchVelocityRules(); // Refresh the rules list
      } else {
        this.error = `Failed to ${this.isEditMode ? 'update' : 'create'} velocity rules`;
      }
    } catch (err: any) {
      this.error = err.message || `Failed to ${this.isEditMode ? 'update' : 'create'} velocity rules`;
      console.error('Velocity rules submission error:', err);
    } finally {
      this.isSubmitting = false;
    }
  }

  async disableRules(accountType: string) {
    this.actionInProgress = true;
    this.actionTypeInProgress = accountType;
    this.error = '';
    this.successMessage = '';
    
    try {
      const response = await this.http
        .delete<any>(
          `https://doronpay.com/api/velocity-rules/${accountType}`,
          { headers: this.getHeaders() }
        )
        .toPromise();
      
      if (response && response.message) {
        this.successMessage = response.message;
        this.fetchVelocityRules(); // Refresh the rules list
      } else {
        this.error = 'Failed to disable velocity rules';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to disable velocity rules';
      console.error('Velocity rules disable error:', err);
    } finally {
      this.actionInProgress = false;
      this.actionTypeInProgress = '';
      
      // Auto-clear success message after 3 seconds
      if (this.successMessage) {
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    }
  }

  // Utility methods
  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  }
}