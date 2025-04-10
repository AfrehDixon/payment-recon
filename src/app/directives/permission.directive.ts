import { Directive, Input, OnInit, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionService } from '../service/permissions.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  @Input('appHasPermission') permission!: string | string[];
  @Input('appHasPermissionOperation') operation: 'AND' | 'OR' = 'OR';
  
  private subscription?: Subscription;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    // Subscribe to permission changes
    this.subscription = this.permissionService.getPermissions()
      .subscribe(() => {
        this.updateView();
      });
      
    // Initial update
    this.updateView();
  }
  
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  private updateView(): void {
    let hasPermission = false;
    
    if (typeof this.permission === 'string') {
      // Single permission check
      hasPermission = this.permissionService.hasPermission(this.permission);
    } else if (Array.isArray(this.permission)) {
      // Multiple permission check
      if (this.operation === 'AND') {
        hasPermission = this.permissionService.hasAllPermissions(this.permission);
      } else {
        hasPermission = this.permissionService.hasAnyPermission(this.permission);
      }
    }
    
    if (hasPermission && !this.hasView) {
      // Add the template to the view if permissions match
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      // Remove the template from the view if permissions don't match
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}