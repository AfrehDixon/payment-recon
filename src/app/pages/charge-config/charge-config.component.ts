import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  ChargeConfig, 
  ETransactionType, 
  EChargeCalculationMethod, 
  EAccountIssuer,
  Tier 
} from './charge-config.interface';
import { ChargeConfigService } from './charge-config.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-charge-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './charge-config.component.html',
    styleUrls: ['./charge-config.component.scss']
})
export class ChargeConfigComponent implements OnInit {
  configForm!: FormGroup;
  filterForm!: FormGroup;
  chargeConfigs: ChargeConfig[] = [];
  filteredConfigs: ChargeConfig[] = [];
  merchants: any[] = [];
  accountIssuers = Object.values(EAccountIssuer);
  transactionTypes = Object.values(ETransactionType);
  calculationMethods = Object.values(EChargeCalculationMethod);
  
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  pageSizeOptions = [5, 10, 25, 50];

  isEditing = false;
  currentConfigId: string | null = null;
  loading = false;
  showForm = false;

  Math = Math;


  constructor(
    private fb: FormBuilder,
    private service: ChargeConfigService,
  ) {
    this.initForm();
    this.initFilterForm();
  }

  ngOnInit() {
    this.loadChargeConfigs();
    this.loadMerchants();
    this.setupFilterSubscriptions();
  }

  private initFilterForm() {
    this.filterForm = this.fb.group({
      search: [''],
      merchantId: [''],
      accountIssuer: [''],
      transactionType: [''],
      calculationMethod: ['']
    });
  }

  private setupFilterSubscriptions() {
    // Subscribe to search input changes with debounce
    this.filterForm.get('search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      console.log("Search filter updated");
      this.applyFilters();
    });
  
    // // Subscribe to dropdown changes
    // ['merchantId', 'accountIssuer', 'transactionType', 'calculationMethod'].forEach(control => {
    //   this.filterForm.get(control)?.valueChanges.subscribe(value => {
    //     console.log(`${control} filter updated: `, value);
    //     this.applyFilters();
    //   });
    // });
  
    // Apply filters immediately on initialization
    setTimeout(() => this.applyFilters(), 0);
  }
  
  

  getPaginationRange(): number[] {
    const range: number[] = [];
    const maxVisiblePages = 5;
    const totalPages = this.totalPages;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Adjust start if we're near the end
    if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  }

  private applyFilters() {
    const filters = this.filterForm.value;
    console.log("Filters applied: ", filters);
  
    setTimeout(() => { // Ensure values are fully updated before filtering
      this.filteredConfigs = this.chargeConfigs.filter(config => {
        let matches = true;
  
        // Search text
        if (filters.search && filters.search.trim()) {
          const searchLower = filters.search.toLowerCase();
          const merchantName = this.getMerchantName(config.merchantId || '').toLowerCase();
  
          matches = matches && (
            config.name.toLowerCase().includes(searchLower) ||
            merchantName.includes(searchLower) ||
            config.accountIssuers.some(issuer => issuer.toLowerCase().includes(searchLower)) ||
            config.transactionTypes.some(type => type.toLowerCase().includes(searchLower))
          );
        }
  
        // Merchant filter
        if (filters.merchantId && filters.merchantId !== '') {
          matches = matches && (config.merchantId === filters.merchantId || (filters.merchantId === 'global' && config.merchantId === null));
        }
  
        // Account issuer filter
        if (filters.accountIssuer && filters.accountIssuer !== '') {
          matches = matches && config.accountIssuers.includes(filters.accountIssuer);
        }
  
        // Transaction type filter
        if (filters.transactionType && filters.transactionType !== '') {
          matches = matches && config.transactionTypes.includes(filters.transactionType);
        }
  
        // Calculation method filter
        if (filters.calculationMethod && filters.calculationMethod !== '') {
          matches = matches && config.calculationMethod === filters.calculationMethod;
        }
  
        return matches;
      });
  
      console.log("Filtered results: ", this.filteredConfigs);
  
      this.totalItems = this.filteredConfigs.length;
      this.currentPage = 1; // Reset pagination when filters change
    });
  }
  
  

  get paginatedConfigs(): ChargeConfig[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredConfigs.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }


  getUniqueAccountIssuers(): string[] {
    const issuers = new Set<string>();
    this.chargeConfigs.forEach(config => {
      config.accountIssuers.forEach(issuer => issuers.add(issuer));
    });
    return Array.from(issuers).sort();
  }
  
  // Add a method to get unique transaction types from current data
  getUniqueTransactionTypes(): string[] {
    const types = new Set<string>();
    this.chargeConfigs.forEach(config => {
      config.transactionTypes.forEach(type => types.add(type));
    });
    return Array.from(types).sort();
  }
  
  // Add a method to get unique calculation methods from current data
  getUniqueCalculationMethods(): string[] {
    const methods = new Set<string>();
    this.chargeConfigs.forEach(config => {
      methods.add(config.calculationMethod);
    });
    return Array.from(methods).sort();
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  clearFilters() {
    this.filterForm.reset({
      search: '',
      merchantId: '',
      accountIssuer: '',
      transactionType: '',
      calculationMethod: ''
    });
    this.applyFilters();
  }

  private initForm() {
    this.configForm = this.fb.group({
      name: ['', Validators.required],
      merchantId: [null],
      accountIssuers: [[], [Validators.required, Validators.minLength(1)]],
      transactionTypes: [[], [Validators.required, Validators.minLength(1)]],
      calculationMethod: [EChargeCalculationMethod.PERCENTAGE, Validators.required],
      baseRate: [0, [Validators.required, Validators.min(0)]],
      maxCharge: [0, Validators.min(0)],
      minCharge: [0, Validators.min(0)],
      tiers: this.fb.array([])
    });
  }

  addTier() {
    const tiers = this.configForm.get('tiers') as FormArray;
    tiers.push(this.fb.group({
      threshold: [0, [Validators.required, Validators.min(0)]],
      rate: [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeTier(index: number) {
    const tiers = this.configForm.get('tiers') as FormArray;
    tiers.removeAt(index);
  }

  getTiersFormArray() {
    return this.configForm.get('tiers') as FormArray;
  }

  toggleAccountIssuer(issuer: string) {
    const control = this.configForm.get('accountIssuers');
    const currentValues = control?.value || [];
    
    if (currentValues.includes(issuer)) {
      control?.setValue(currentValues.filter((v: string) => v !== issuer));
    } else {
      control?.setValue([...currentValues, issuer]);
    }
  }

  toggleTransactionType(type: string) {
    const control = this.configForm.get('transactionTypes');
    const currentValues = control?.value || [];
    
    if (currentValues.includes(type)) {
      control?.setValue(currentValues.filter((v: string) => v !== type));
    } else {
      control?.setValue([...currentValues, type]);
    }
  }

  isAccountIssuerSelected(issuer: string): boolean {
    return (this.configForm.get('accountIssuers')?.value || []).includes(issuer);
  }

  isTransactionTypeSelected(type: string): boolean {
    return (this.configForm.get('transactionTypes')?.value || []).includes(type);
  }

  loadChargeConfigs() {
    this.loading = true;
    this.service.getChargeConfigs().subscribe({
      next: (response) => {
        this.chargeConfigs = response.data;
        this.filteredConfigs = [...this.chargeConfigs]; // Initialize filtered configs
        this.totalItems = this.chargeConfigs.length;
        this.loading = false;
  
        // console.log("Configs Loaded:", this.chargeConfigs);
        this.applyFilters(); // Ensure filters are applied after data loads
      },
      error: (error) => {
        console.error('Error loading configs:', error);
        this.loading = false;
      }
    });
  }
  

  loadMerchants() {
    this.service.getMerchants().subscribe({
      next: (response) => {
        this.merchants = response.data;
      },
      error: () => {}
    });
  }

  getMerchantName(merchantId: string): string {
    const merchant = this.merchants.find(m => m._id === merchantId);
    return merchant ? merchant.merchant_tradeName : '';
  }

  onSubmit() {
    if (this.configForm.invalid) return;

    this.loading = true;
    const config = this.configForm.value;
    const operation = this.isEditing
      ? this.service.updateChargeConfig(this.currentConfigId!, config)
      : this.service.createChargeConfig(config);

    operation.subscribe({
      next: () => {
        this.resetForm();
        this.loadChargeConfigs();
        this.showForm = false;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  editConfig(config: ChargeConfig) {
    this.isEditing = true;
    this.showForm = true;
    this.currentConfigId = config._id ?? null;
    
    // Reset tiers FormArray
    const tiersArray = this.configForm.get('tiers') as FormArray;
    while (tiersArray.length) {
      tiersArray.removeAt(0);
    }
    
    // Add existing tiers
    config.tiers?.forEach(tier => {
      tiersArray.push(this.fb.group({
        threshold: [tier.threshold, [Validators.required, Validators.min(0)]],
        rate: [tier.rate, [Validators.required, Validators.min(0)]]
      }));
    });

    this.configForm.patchValue({
      name: config.name,
      merchantId: config.merchantId,
      accountIssuers: config.accountIssuers,
      transactionTypes: config.transactionTypes,
      calculationMethod: config.calculationMethod,
      baseRate: config.baseRate,
      maxCharge: config.maxCharge || 0,
      minCharge: config.minCharge || 0
    });
  }

  resetForm() {
    this.isEditing = false;
    this.currentConfigId = null;
    this.showForm = false;
    const tiersArray = this.configForm.get('tiers') as FormArray;
    while (tiersArray.length) {
      tiersArray.removeAt(0);
    }
    this.configForm.reset({
      calculationMethod: EChargeCalculationMethod.PERCENTAGE,
      baseRate: 0,
      maxCharge: 0,
      minCharge: 0,
      accountIssuers: [],
      transactionTypes: []
    });
  }

  formatNumber(value: number): string {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  }
}