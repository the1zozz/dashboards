import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Board } from '@integralways/dashboards/ui';
import { DemoSettings } from './demo-settings';

const TEXT = {
  en: { title: 'Dashboards demo', example: 'Example data', subtitle: 'A project using @integralways/dashboards with no server: made-up numbers, dashboards kept in memory.',
    language: 'العربية', dark: 'Dark', light: 'Light', languageLabel: 'Show in Arabic', themeLabel: 'Switch theme' },
  ar: { title: 'عرض لوحات المعلومات', example: 'بيانات تجريبية', subtitle: 'مشروع يستخدم ‎@integralways/dashboards‎ دون خادم: أرقام مختلَقة ولوحات محفوظة في الذاكرة.',
    language: 'English', dark: 'داكن', light: 'فاتح', languageLabel: 'Show in English', themeLabel: 'تبديل المظهر' },
};

/** The demo page: the sample dashboard, and the switches a real project would have in its own shell. */
@Component({
  selector: 'demo-root',
  imports: [Board],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly settings = inject(DemoSettings);
  protected readonly text = computed(() => TEXT[this.settings.language()]);

  protected toggleLanguage(): void {
    this.settings.language.update((l) => (l === 'en' ? 'ar' : 'en'));
  }

  protected toggleTheme(): void {
    this.settings.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }
}
