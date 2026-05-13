import { PublicSiteFooter } from "@/components/site/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/site/PublicSiteHeader";

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <PublicSiteHeader active="privacy" />
      <div className="flex-1">{children}</div>
      <PublicSiteFooter />
    </div>
  );
}
