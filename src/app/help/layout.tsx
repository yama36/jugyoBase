import { PublicSiteFooter } from "@/components/site/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/site/PublicSiteHeader";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <PublicSiteHeader active="help" containerClassName="max-w-6xl" />
      <div className="flex-1">{children}</div>
      <PublicSiteFooter containerClassName="max-w-6xl" />
    </div>
  );
}
