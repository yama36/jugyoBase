/** yamalog 問い合わせ API（identFill 共通フォーム） */
export const CONTACT_FORM_APP_ID = 4;

export const CONTACT_FORM_SOURCE = "jugyoBase";

const DEFAULT_BASE = "https://yamalog.net/api/contactForm";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getContactFormSubmitUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CONTACT_FORM_SUBMIT_URL?.trim();
  if (fromEnv) return fromEnv;
  return `${trimTrailingSlash(DEFAULT_BASE)}/inquiry`;
}

export function getContactFormConfigUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CONTACT_FORM_CONFIG_URL?.trim();
  if (fromEnv) return fromEnv;
  return `${trimTrailingSlash(DEFAULT_BASE)}/config`;
}

export type ContactFormConfigResponse = {
  require_privacy_consent: boolean;
  privacy_policy_url?: string | null;
};

export async function fetchContactFormConfig(): Promise<ContactFormConfigResponse> {
  const res = await fetch(getContactFormConfigUrl(), {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`設定の取得に失敗しました（${res.status}）`);
  }
  return (await res.json()) as ContactFormConfigResponse;
}

export type InquiryType = "不具合報告" | "お問い合わせ" | "機能要望";

export type InquiryPayload = {
  type: InquiryType;
  app_id: number;
  name: string;
  email: string;
  body: string;
  source: string;
  form_loaded_at: number;
  website: string;
  privacy_consent?: boolean;
  reproduction_steps?: string;
  environment?: string;
  frequency?: string;
  response_priority?: string;
  inquiry_category?: string;
  preferred_contact_method?: string;
  preferred_contact_time?: string;
  phone_number?: string;
  desired_feature_summary?: string;
  use_case_reason?: string;
  priority?: string;
};

export type InquirySuccessResponse = {
  success: true;
  id: number;
  message: string;
};

export type InquiryErrorResponse = {
  success: false;
  message: string;
};

export async function postInquiry(
  payload: InquiryPayload,
): Promise<{ ok: true; data: InquirySuccessResponse } | { ok: false; status: number; message: string }> {
  const res = await fetch(getContactFormSubmitUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return {
      ok: false,
      status: res.status,
      message: "サーバーから不正な応答がありました。",
    };
  }

  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json !== null &&
      "message" in json &&
      typeof (json as InquiryErrorResponse).message === "string"
        ? (json as InquiryErrorResponse).message
        : `送信に失敗しました（${res.status}）`;
    return { ok: false, status: res.status, message: msg };
  }

  const data = json as InquirySuccessResponse;
  if (!data.success) {
    return {
      ok: false,
      status: res.status,
      message: typeof data.message === "string" ? data.message : "送信に失敗しました。",
    };
  }

  return { ok: true, data };
}
