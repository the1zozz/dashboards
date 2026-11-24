import { computed, EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { DASHBOARD_LANGUAGE } from '../contract/plugins';
import { Language, MESSAGES, MessageKey } from './messages';

/**
 * The language the package shows, followed live: when the project's language function reads a signal, a language
 * switch re-renders the dashboards. Unknown languages fall back to English.
 */
@Injectable({ providedIn: 'root' })
export class DashI18n {
  private readonly source = inject(DASHBOARD_LANGUAGE, { optional: true }) ?? (() => 'en');
  private readonly injector = inject(EnvironmentInjector);

  /** The project's language function runs in its injector, so it may use inject(): () => inject(MyLanguage).current(). */
  readonly language = computed<Language>(() => (runInInjectionContext(this.injector, this.source) === 'ar' ? 'ar' : 'en'));
  readonly dir = computed<'ltr' | 'rtl'>(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));
  /** Arabic with Arabic-Indic digits, as the rest of an Arabic page. */
  private readonly locale = computed(() => (this.language() === 'ar' ? 'ar-EG' : 'en-US'));

  /** The text for {@link key}; a widget type's own label (not a package key) is returned as it is. */
  t(key: MessageKey | string): string {
    const messages = MESSAGES[this.language()] as Record<string, string>;
    return messages[key] ?? key;
  }

  number(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.locale(), { maximumFractionDigits: 2, ...options }).format(value);
  }

  /** A change as a signed percentage, e.g. "+12%"; null when there is nothing to compare with. */
  change(value: number, previous: number | undefined): string | null {
    if (previous === undefined || previous === 0) {
      return null;
    }
    const ratio = (value - previous) / Math.abs(previous);
    return new Intl.NumberFormat(this.locale(), { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).format(ratio);
  }
}
