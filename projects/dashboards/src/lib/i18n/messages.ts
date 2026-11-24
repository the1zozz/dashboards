/**
 * The package's own words, in English and Arabic. Projects need no i18n library: the package reads the language from
 * the function given to provideDashboards. A test keeps both languages in step.
 */
export const MESSAGES = {
  en: {
    'board.loading': 'Loading the dashboard…',
    'board.failed': 'The dashboard could not be loaded.',
    'board.retry': 'Try again',
    'board.empty': 'This dashboard has no widgets yet.',
    'widget.failed': 'This widget could not be loaded.',
    'widget.retry': 'Try again',
    'widget.noAccess': 'You don’t have access to this data.',
    'widget.noData': 'No data for this period.',
    'widget.vsPrevious': 'vs previous period',
    'widget.noPrevious': 'nothing in the previous period',
    'widget.total': 'Total',
    'widget.unknown': 'This widget type is not available here:',
    'type.number': 'Number',
    'type.number.text': 'One figure, and how it changed.',
    'type.trend': 'Trend',
    'type.trend.text': 'A line over time.',
    'type.breakdown': 'Breakdown',
    'type.breakdown.text': 'Bars, split by one field.',
    'type.table': 'Table',
    'type.table.text': 'Rows and columns.',
    'type.note': 'Note',
    'type.note.text': 'Text that explains the dashboard.',
  },
  ar: {
    'board.loading': 'جارٍ تحميل لوحة المعلومات…',
    'board.failed': 'تعذّر تحميل لوحة المعلومات.',
    'board.retry': 'إعادة المحاولة',
    'board.empty': 'لا تحتوي هذه اللوحة على عناصر بعد.',
    'widget.failed': 'تعذّر تحميل هذا العنصر.',
    'widget.retry': 'إعادة المحاولة',
    'widget.noAccess': 'لا تملك صلاحية الاطلاع على هذه البيانات.',
    'widget.noData': 'لا توجد بيانات في هذه الفترة.',
    'widget.vsPrevious': 'مقارنةً بالفترة السابقة',
    'widget.noPrevious': 'لا شيء في الفترة السابقة',
    'widget.total': 'الإجمالي',
    'widget.unknown': 'نوع العنصر هذا غير متاح هنا:',
    'type.number': 'رقم',
    'type.number.text': 'رقم واحد ومقدار تغيّره.',
    'type.trend': 'اتجاه',
    'type.trend.text': 'خط عبر الزمن.',
    'type.breakdown': 'توزيع',
    'type.breakdown.text': 'أعمدة مقسّمة حسب حقل واحد.',
    'type.table': 'جدول',
    'type.table.text': 'صفوف وأعمدة.',
    'type.note': 'ملاحظة',
    'type.note.text': 'نص يشرح اللوحة.',
  },
} as const;

export type MessageKey = keyof (typeof MESSAGES)['en'];
export type Language = keyof typeof MESSAGES;
