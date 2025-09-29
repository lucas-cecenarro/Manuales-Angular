import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'roleDisplay', standalone: true })
export class RoleDisplayPipe implements PipeTransform {
  transform(value?: string): string {
    const v = (value || '').toLowerCase();
    if (v === 'buyer' || v === 'cliente') return 'cliente';
    if (v === 'seller' || v === 'vendedor') return 'vendedor';
    return v || '';
  }
}
