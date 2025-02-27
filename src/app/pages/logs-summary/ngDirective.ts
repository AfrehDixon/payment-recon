import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[ngLet]',
  standalone: true
})
export class NgLetDirective {
  private _context: { ngLet: any } = { ngLet: null };

  constructor(
    private _viewContainer: ViewContainerRef,
    private _templateRef: TemplateRef<{ ngLet: any }>
  ) {}

  @Input()
  set ngLet(value: any) {
    this._context.ngLet = value;
    this._viewContainer.clear();
    this._viewContainer.createEmbeddedView(this._templateRef, this._context);
  }
}