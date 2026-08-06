import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-skeleton',
  template: `
    <div class="skeleton" data-testid="skeleton" aria-hidden="true">
      @for (line of linesArray; track $index) {
        <div class="line"></div>
      }
    </div>
  `,
  styles: [
    `
      .skeleton {
        display: grid;
        gap: 0.65rem;
      }
      .line {
        height: 0.9rem;
        border-radius: 999px;
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--border) 70%, transparent),
          color-mix(in srgb, var(--accent-soft) 80%, transparent),
          color-mix(in srgb, var(--border) 70%, transparent)
        );
        background-size: 200% 100%;
        animation: mind-shimmer 1.4s ease-in-out infinite;
      }
      .line:nth-child(odd) {
        width: 92%;
      }
      .line:nth-child(even) {
        width: 74%;
      }
    `,
  ],
})
export class SkeletonComponent {
  @Input() lines = 3

  get linesArray(): number[] {
    return Array.from({ length: Math.max(1, this.lines) }, (_, index) => index)
  }
}
