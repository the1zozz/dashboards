import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { Dashboard } from '@integralways/dashboards';
import { Board, DashboardList } from '@integralways/dashboards/ui';
import type { DashboardOpen } from '@integralways/dashboards/ui';
import { DemoSettings } from './demo-settings';

const TEXT = {
  en: { title: 'Dashboards demo', example: 'Example data', subtitle: 'A project using @integralways/dashboards with no server: made-up numbers, dashboards kept in memory.',
    language: 'العربية', dark: 'Dark', light: 'Light', languageLabel: 'Show in Arabic', themeLabel: 'Switch theme', back: '← All dashboards' },
  ar: { title: 'عرض لوحات المعلومات', example: 'بيانات تجريبية', subtitle: 'مشروع يستخدم ‎@integralways/dashboards‎ دون خادم: أرقام مختلَقة ولوحات محفوظة في الذاكرة.',
    language: 'English', dark: 'داكن', light: 'فاتح', languageLabel: 'Show in English', themeLabel: 'تبديل المظهر', back: '→ كل اللوحات' },
};

/**
 * The demo page: the list of dashboards, and one dashboard when opened, with the switches a real project would have in
 * its own shell. The address keeps the dashboard open (#id), as a project's router would, so a card opens in a new tab.
 */
@Component({
  selector: 'demo-root',
  imports: [Board, DashboardList],
  host: { '(window:hashchange)': 'readAddress()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly settings = inject(DemoSettings);
  protected readonly text = computed(() => TEXT[this.settings.language()]);
  /** The dashboard shown, and whether it opens to edit (just made). Null shows the list. */
  protected readonly opened = signal<DashboardOpen | null>(null);
  protected readonly link = (id: string) => `#${encodeURIComponent(id)}`;

  constructor() {
    this.readAddress();
  }

  protected readAddress(): void {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id !== this.opened()?.id) {
      this.opened.set(id ? { id, edit: false } : null);
    }
  }

  protected show(open: DashboardOpen | null): void {
    this.opened.set(open);
    history.pushState(null, '', open ? this.link(open.id) : location.pathname);
    scrollTo({ top: 0 });
  }

  protected openCopy(copy: Dashboard): void {
    this.show({ id: copy.id, edit: true });
  }

  protected toggleLanguage(): void {
    this.settings.language.update((l) => (l === 'en' ? 'ar' : 'en'));
  }

  protected toggleTheme(): void {
    this.settings.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }
}
