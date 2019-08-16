import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unslash'
})
export class UnslashPipe implements PipeTransform {

  transform(value: string, args?: any): string {
    return value.replace('/', '');
  }

}
