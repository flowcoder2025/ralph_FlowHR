interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="text-sm text-text-tertiary mb-sp-2" aria-label="breadcrumb">
      <ol className="flex items-center gap-sp-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-sp-1">
            {i > 0 && <span>&rsaquo;</span>}
            {item.href ? (
              <a href={item.href} className="hover:text-text-primary transition-colors">{item.label}</a>
            ) : (
              <span className="text-text-primary font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export type { BreadcrumbItem };
