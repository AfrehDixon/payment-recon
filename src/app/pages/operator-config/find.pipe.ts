import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'find',
  standalone: true
})
export class FindPipe implements PipeTransform {
  transform(array: any[], id: string, idKey: string, displayKey: string): any {
    if (!array || !id) return '';
    const item = array.find(x => x[idKey] === id);
    return item ? item[displayKey] : '';
  }
}