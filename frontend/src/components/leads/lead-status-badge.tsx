import type { LeadStatus } from '../../types/leads';
import { STATUS_META } from '../../types/leads';

export function LeadStatusBadge({ status }: { status: LeadStatus }) { const meta = STATUS_META[status]; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>; }
