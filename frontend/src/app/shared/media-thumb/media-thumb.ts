import { Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-media-thumb',
  imports: [MatIconModule],
  template: `
    @if (src() && !failed()) {
      <img class="media-thumb" [src]="src()" [alt]="alt()" (error)="failed.set(true)" />
    } @else {
      <div class="media-placeholder">
        <mat-icon>image</mat-icon>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
  `,
})
export class MediaThumb {
  readonly src = input<string | null | undefined>(null);
  readonly alt = input('');
  readonly failed = signal(false);
}
