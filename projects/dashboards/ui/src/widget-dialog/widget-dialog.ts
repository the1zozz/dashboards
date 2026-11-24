import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DashboardFilters, Widget, WidgetType } from '@integralways/dashboards';
import { DashI18n } from '../i18n/dash-i18n';
import { WidgetBuilder, WidgetDraft } from '../builder/widget-builder';
import { WidgetRegistry } from '../widgets/widget-registry';

/** What the dialog is opened with: the dashboard's filters (for the preview), and the widget when editing one. */
export interface WidgetDialogData {
  filters: DashboardFilters;
  widget?: Widget;
}

/**
 * Adds or edits a widget. A new one: choose its type, then build it. An existing one: straight to the builder. Closes
 * with the finished widget, or with nothing on cancel. Focus is kept inside and returned afterwards by the CDK dialog.
 */
@Component({
  selector: 'dash-widget-dialog',
  imports: [WidgetBuilder],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-dialog.html',
  styleUrl: './widget-dialog.scss',
})
export class WidgetDialog {
  protected readonly data = inject<WidgetDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<WidgetDraft>>(DialogRef);
  protected readonly i18n = inject(DashI18n);
  protected readonly types = inject(WidgetRegistry).all();

  protected readonly chosen = signal<WidgetType | null>(this.data.widget ? inject(WidgetRegistry).get(this.data.widget.type) ?? null : null);
  protected readonly initial = computed<WidgetDraft | null>(() => {
    const w = this.data.widget;
    return w ? { type: w.type, title: w.title, settings: w.settings, query: w.query } : null;
  });
  protected readonly heading = computed(() => {
    const type = this.chosen();
    if (!type) {
      return this.i18n.t('add.title');
    }
    return this.i18n.t(this.data.widget ? 'builder.titleEdit' : 'builder.titleNew', { type: this.i18n.t(type.label) });
  });

  protected finish(widget: WidgetDraft): void {
    this.ref.close(widget);
  }

  protected close(): void {
    this.ref.close();
  }
}
