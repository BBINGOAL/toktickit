import type { ActionTaken } from '../../api/actions'
import { formatTime } from './presentation'

export default function ActionDetails({ action }: { action: ActionTaken }) {
  return <dl className="action-details">{Object.entries({
    'Work date/time': formatTime(action.actionDateTime), Description: action.description, Result: action.result || 'Not recorded',
    'Performed by': action.performedBy.name, Assignee: action.assignee.name, Status: action.status, 'Work cycle': action.workCycle,
    'Follow-up required': action.followUpRequired ? 'Yes' : 'No', 'Follow-up note': action.followUpNote || 'None',
    'Attachment notes': action.attachmentNotes || 'None', 'Follows up action': action.followsUpActionId ?? 'None',
    'Cancellation reason': action.cancellationReason || 'None', 'Recorded at': formatTime(action.createdAt),
  }).map(([label, value]) => <div key={label} style={{ display: 'contents' }}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}

