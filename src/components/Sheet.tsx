import { useEffect, type ReactNode } from 'react';
import { Close } from './Icons';

export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`sheet-wrap ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="sheet__scrim" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div className="sheet glass" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grip" aria-hidden="true" />
        <header className="sheet__head">
          <div>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h2 className="sheet__title serif">{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Close size={20} />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}
