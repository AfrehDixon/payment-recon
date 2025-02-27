import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";

// Import enums and interfaces
import { EOperator, ETierLevel, ETierScope, ETierStatus, Merchant, MerchantTier, TierSearchParams } from "./merchant-tier.interface";
import { AdminService } from "../../service/admin.service";

@Component({
    selector: 'app-merchant-tier',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        RouterModule
    ],
    templateUrl: './merchant-tier.component.html',
    styleUrls: ['./merchant-tier.component.scss']
})
export class MerchantTierComponent implements OnInit {
    // Forms
    searchForm: FormGroup;
    tierForm: FormGroup;
    
    // Data
    merchants: Merchant[] = [];
    merchantTiers: MerchantTier[] = [];
    selectedMerchant: Merchant | null = null;
    selectedTier: MerchantTier | null = null;
    
    // Enums for template
    tierLevels = Object.values(ETierLevel).filter(value => typeof value === 'number');
    tierScopes = Object.values(ETierScope);
    tierStatuses = Object.values(ETierStatus);
    operators = Object.values(EOperator);
    
    // UI states
    loading = false;
    creating = false;
    updating = false;
    error: string | null = null;
    success: string | null = null;
    viewMode: 'list' | 'create' | 'edit' = 'list';
    
    constructor(
        private fb: FormBuilder,
        private tierService: AdminService
    ) {
        // Initialize search form
        this.searchForm = this.fb.group({
            merchantId: [''],
            scope: [ETierScope.GLOBAL],
            level: [''],
            feature: ['']
        });
        
        // Initialize tier form
        this.tierForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            level: [null, Validators.required],
            merchantId: ['', Validators.required],
            scope: [ETierScope.GLOBAL],
            status: [ETierStatus.ACTIVE],
            transactionLimits: this.fb.group({
                debit: this.fb.group({
                    dailyLimit: [0, Validators.min(0)],
                    monthlyLimit: [0, Validators.min(0)],
                    maxSingleTransactionAmount: [0, Validators.min(0)]
                }),
                credit: this.fb.group({
                    dailyLimit: [0, Validators.min(0)],
                    monthlyLimit: [0, Validators.min(0)],
                    maxSingleTransactionAmount: [0, Validators.min(0)]
                })
            }),
            features: [[]],
            monthlyFee: [0, Validators.min(0)],
            description: ['']
        });
    }
    
    ngOnInit(): void {
        this.fetchMerchants();
        this.tierService.getMerchantTiers().subscribe({
            next: (tiers) => {
                this.merchantTiers = tiers;
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Failed to fetch merchant tiers.';
                this.loading = false;
            }
        });
    }

    getStatusClass(status: ETierStatus): string {
        return status === ETierStatus.ACTIVE ? 'text-success' : 'text-danger';
    }
    
    // Fetch merchants list
    fetchMerchants() {
        this.loading = true;
        this.tierService.getMerchants()
          .subscribe({
            next: (response) => {
              this.merchants = response.data; // Assign the array of merchants
              this.loading = false;
            },
            error: (error) => {
              this.error = 'Failed to load merchants.';
              this.loading = false;
            }
          });
      }
    
    // Search for tiers based on form criteria
    searchTiers() {
        this.loading = true;
        this.error = null;
        
        const filters: TierSearchParams = {};
        const formValue = this.searchForm.value;
        
        if (formValue.merchantId) filters.merchantId = formValue.merchantId;
        if (formValue.scope) filters.scope = formValue.scope;
        if (formValue.level) filters.level = formValue.level;
        if (formValue.feature) filters.feature = formValue.feature;
        
        this.tierService.getMerchantTiers(filters)
            .subscribe({
                next: (tiers) => {
                    this.merchantTiers = tiers;
                    this.loading = false;
                },
                error: (error) => {
                    this.error = 'Failed to fetch merchant tiers.';
                    this.loading = false;
                }
            });
    }
    
    // Create new tier
    createTier() {
        if (this.tierForm.invalid) {
            this.markFormGroupTouched(this.tierForm);
            return;
        }
        
        this.creating = true;
        this.error = null;
        
        // const merchantId = this.tierForm.value.merchantId;
        const { merchantId, ...tierData } = this.tierForm.value;

        
        this.tierService.createTier(merchantId, tierData)
            .subscribe({
                next: (response) => {
                    this.success = 'Tier created successfully.';
                    this.viewMode = 'list';
                    this.searchTiers();
                    this.creating = false;
                    setTimeout(() => this.success = null, 3000);
                },
                error: (error) => {
                    this.error = 'Failed to create tier.';
                    this.creating = false;
                }
            });
    }
    
    // Update existing tier
    updateTier() {
        if (this.tierForm.invalid) {
            this.markFormGroupTouched(this.tierForm);
            return;
        }
        
        this.updating = true;
        this.error = null;
        
        const tierId = this.selectedTier?._id;
        if (!tierId) {
            this.error = 'Tier ID not found.';
            this.updating = false;
            return;
        }
        
        this.tierService.updateTier(tierId, this.tierForm.value)
            .subscribe({
                next: (response) => {
                    this.success = 'Tier updated successfully.';
                    this.viewMode = 'list';
                    this.searchTiers();
                    this.updating = false;
                    setTimeout(() => this.success = null, 3000);
                },
                error: (error) => {
                    this.error = 'Failed to update tier.';
                    this.updating = false;
                }
            });
    }
    
    // Assign tier to merchant
    assignTierToMerchant(tierId: string) {
        if (!this.searchForm.value.merchantId) {
            this.error = 'Please select a merchant.';
            return;
        }
        
        this.loading = true;
        
        // Find the tier to get its level
        const tier = this.merchantTiers.find(t => t._id === tierId);
        if (!tier) {
            this.error = 'Tier not found.';
            this.loading = false;
            return;
        }
        
        this.tierService.assignTierToMerchant(this.searchForm.value.merchantId, {
            preferredLevel: tier.level
        })
        .subscribe({
            next: (response) => {
                this.success = 'Tier assigned successfully.';
                this.fetchMerchants(); // Refresh merchant list
                this.loading = false;
                setTimeout(() => this.success = null, 3000);
            },
            error: (error) => {
                this.error = 'Failed to assign tier to merchant.';
                this.loading = false;
            }
        });
    }
    
    // UI Helpers
    editTier(tier: MerchantTier) {
        this.selectedTier = tier;
        this.tierForm.patchValue(tier);
        this.viewMode = 'edit';
    }
    
    startCreateTier() {
        this.tierForm.reset({
            scope: ETierScope.GLOBAL,
            status: ETierStatus.ACTIVE,
            transactionLimits: {
                debit: {
                    dailyLimit: 0,
                    monthlyLimit: 0,
                    maxSingleTransactionAmount: 0
                },
                credit: {
                    dailyLimit: 0,
                    monthlyLimit: 0,
                    maxSingleTransactionAmount: 0
                }
            },
            features: [],
            monthlyFee: 0
        });
        this.viewMode = 'create';
    }
    
    cancelEdit() {
        this.viewMode = 'list';
        this.selectedTier = null;
    }
    
    selectMerchant(merchant: Merchant) {
        this.selectedMerchant = merchant;
        this.searchForm.patchValue({ merchantId: merchant._id });
    }
    
    // Helper to mark all form controls as touched
    markFormGroupTouched(formGroup: FormGroup) {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }
    
    // Convert enum number to readable string
    getTierLevelName(level: ETierLevel): string {
        return this.tierService.getTierLevelName(level);
    }
    
    // Add a feature to the features array
    addFeature(feature: string) {
        if (!feature) return;
        
        const features = this.tierForm.get('features')?.value || [];
        if (!features.includes(feature)) {
            this.tierForm.patchValue({ features: [...features, feature] });
        }
    }
    
    // Remove a feature from the features array
    removeFeature(feature: string) {
        const features = this.tierForm.get('features')?.value || [];
        this.tierForm.patchValue({ 
            features: features.filter((f: string) => f !== feature) 
        });
    }
}