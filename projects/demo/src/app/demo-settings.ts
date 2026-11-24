import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';

/** The demo's own language and theme switches; the package follows the language through provideDashboards. */
@Injectable({ providedIn: 'root' })
export class DemoSettings {
  readonly language = signal<'en' | 'ar'>('en');
  readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    effect(() => {
      root.lang = this.language();
      root.dir = this.language() === 'ar' ? 'rtl' : 'ltr';
      root.dataset['theme'] = this.theme();
    });
  }
}
