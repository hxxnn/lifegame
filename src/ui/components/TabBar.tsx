import { Icon, type IconName } from './Icons';

export interface TabDef<T extends string> { id: T; icon: IconName; label: string }

export function TabBar<T extends string>({ tabs, current, onSelect }: { tabs: TabDef<T>[]; current: T; onSelect: (id: T) => void }) {
  const index = Math.max(0, tabs.findIndex((t) => t.id === current));
  return (
    <nav className="tabbar glass" aria-label="메뉴">
      <div className="tabbar-inner" style={{ ['--i' as string]: index, ['--n' as string]: tabs.length }}>
        <span className="tab-ind" aria-hidden="true" />
        {tabs.map((t) => (
          <button key={t.id} className="tab" aria-current={current === t.id ? 'page' : undefined} onClick={() => onSelect(t.id)}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
