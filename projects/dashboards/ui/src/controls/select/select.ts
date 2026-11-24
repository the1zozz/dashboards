import { CdkListbox, CdkOption, ListboxValueChangeEvent } from '@angular/cdk/listbox';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, model, signal, viewChild } from '@angular/core';
import { DashI18n } from '../../i18n/dash-i18n';

/** One choice: what is stored, what is shown, and an optional hint line. */
export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

let next = 0;

/**
 * A select drawn by the package, themed and mirrored like the rest (a native select's popup is drawn by the system,
 * ignores dark mode and cannot show hints). Keyboard and screen readers come from the CDK listbox. Long lists can be
 * filtered by typing. Usage: {@code <dash-select [options]="…" [(value)]="…" [label]="…" />}.
 */
@Component({
  selector: 'dash-select',
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, CdkListbox, CdkOption],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class Select {
  readonly options = input.required<SelectOption[]>();
  readonly value = model<string | null>(null);
  /** The visible label's text; read by screen readers as the control's name. */
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly disabled = input(false);
  /** Mark it invalid (a required choice not made yet, after the user tried to continue). */
  readonly invalid = input(false);

  protected readonly i18n = inject(DashI18n);
  protected readonly id = `dash-select-${next++}`;
  protected readonly open = signal(false);
  protected readonly filter = signal('');
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected readonly selected = computed(() => this.options().find((o) => o.value === this.value()) ?? null);
  /** A filter box only when the list is long enough to need one. */
  protected readonly filterable = computed(() => this.options().length > 8);
  protected readonly shown = computed(() => {
    const f = this.filter().trim().toLowerCase();
    return f ? this.options().filter((o) => o.label.toLowerCase().includes(f) || o.value.toLowerCase().includes(f)) : this.options();
  });
  protected readonly width = signal(0);

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.width.set(this.trigger().nativeElement.getBoundingClientRect().width);
    this.filter.set('');
    this.open.update((o) => !o);
  }

  protected choose(event: ListboxValueChangeEvent<string>): void {
    const value = event.value[0];
    if (value !== undefined) {
      this.value.set(value);
    }
    this.close();
  }

  protected close(): void {
    if (this.open()) {
      this.open.set(false);
      this.trigger().nativeElement.focus();
    }
  }
}
