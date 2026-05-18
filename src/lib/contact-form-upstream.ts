/** サーバー側のみ: yamalog 問い合わせ API への上流 URL */

const DEFAULT_UPSTREAM_BASE = "https://yamalog.net/api/contactForm";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getContactFormUpstreamBase(): string {
  const fromEnv = process.env.CONTACT_FORM_UPSTREAM_BASE?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  return trimTrailingSlash(DEFAULT_UPSTREAM_BASE);
}

export function getContactFormUpstreamConfigUrl(): string {
  return `${getContactFormUpstreamBase()}/config`;
}

export function getContactFormUpstreamInquiryUrl(): string {
  return `${getContactFormUpstreamBase()}/inquiry`;
}
