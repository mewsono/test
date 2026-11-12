import { SECTIONS, type SectionId } from '../data/library';
import { Disc, Home, List, Search } from './Icons';

const ICONS = { home: Home, albums: Disc, search: Search, lists: List };

export function NavBar({
  active,
  onChange,
}: {
  active: SectionId;
  onChange: (s: SectionId) => void;
}) {
  return (
    <nav className="nav glass" aria-label="Sections">
      {SECTIONS.map((s) => {
        const Icon = ICONS[s.id];
        const on = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            className={`nav__btn ${on ? 'is-active' : ''}`}
            onClick={() => onChange(s.id)}
            aria-current={on ? 'page' : undefined}
            aria-label={s.label}
          >
            <Icon size={22} />
            <span className="nav__label">{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
