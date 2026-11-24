import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { WidgetView } from '@integralways/dashboards';

/** Text that explains the dashboard. Setting {@code text}; a blank line starts a new paragraph. Shown as plain text. */
@Component({
  selector: 'dash-note-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note-widget.html',
  styleUrl: './note-widget.scss',
})
export class NoteWidget {
  readonly view = input.required<WidgetView>();

  protected readonly paragraphs = computed(() => {
    const text = this.view().settings['text'];
    return typeof text === 'string' ? text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];
  });
}
