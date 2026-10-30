import type { PageMeta } from '../../api/actions'

export default function Pager({ meta, change, disabled = false, label }: { meta: PageMeta; change: (page: number) => void; disabled?: boolean; label: string }) {
  return <nav className="actions-toolbar" aria-label={label}>
    <span>{meta.totalItems} records · Page {meta.totalPages ? meta.page : 0} of {meta.totalPages}</span>
    <button type="button" disabled={disabled || meta.page <= 1} onClick={() => change(meta.page - 1)}>Previous</button>
    <button type="button" disabled={disabled || meta.page >= meta.totalPages} onClick={() => change(meta.page + 1)}>Next</button>
  </nav>
}
