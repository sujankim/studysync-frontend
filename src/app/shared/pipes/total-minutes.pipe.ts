import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'totalMinutes',
  standalone: true,
})
export class TotalMinutesPipe implements PipeTransform {
  transform(minutes: number[]): string {
    const total = minutes.reduce((a, b) => a + b, 0);
    if (total === 0) return '0m';
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
}
