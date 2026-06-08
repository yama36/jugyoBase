import Link from "next/link";

type Props = {
  tenantSlug: string;
  active: "users" | "curriculum" | "settings" | "export";
};

const LINKS: { key: Props["active"]; href: string; label: string }[] = [
  { key: "users", href: "users", label: "ユーザー管理" },
  { key: "curriculum", href: "curriculum", label: "単元マスタ" },
  { key: "settings", href: "settings", label: "学校設定" },
  { key: "export", href: "export", label: "データエクスポート" },
];

export function AdminNav({ tenantSlug, active }: Props) {
  return (
    <nav className="mt-2 flex flex-wrap gap-4 text-sm">
      {LINKS.map((link) =>
        link.key === active ? (
          <span
            key={link.key}
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            {link.label}
          </span>
        ) : (
          <Link
            key={link.key}
            href={`/t/${tenantSlug}/admin/${link.href}`}
            className="text-zinc-500 hover:text-zinc-800"
          >
            {link.label}
          </Link>
        ),
      )}
    </nav>
  );
}
