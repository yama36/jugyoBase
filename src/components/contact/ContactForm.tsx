"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTACT_FORM_APP_ID,
  CONTACT_FORM_SOURCE,
  fetchContactFormConfig,
  postInquiry,
  type InquiryPayload,
  type InquiryType,
} from "@/lib/contact-form";

const inputClass =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30";
const labelClass = "block text-sm font-medium text-zinc-700";

const INQUIRY_TYPES: { value: InquiryType; label: string }[] = [
  { value: "不具合報告", label: "不具合報告" },
  { value: "お問い合わせ", label: "お問い合わせ" },
  { value: "機能要望", label: "機能要望" },
];

const INQUIRY_CATEGORIES = [
  "操作方法・使い方",
  "不具合・エラー表示",
  "アカウント・ログイン",
  "データ・セキュリティ",
  "その他",
] as const;

const CONTACT_METHODS = ["メール", "電話"] as const;

const CONTACT_TIME_PRESETS = [
  "午前中（9〜12時）",
  "午後（12〜17時）",
  "平日日中のみ",
  "土日祝も可",
  "その他（下欄に記入）",
] as const;

const BUG_RESPONSE_PRIORITY = ["至急", "できるだけ早く", "通常"] as const;
const FEATURE_PRIORITY = ["高", "中", "低"] as const;

export type ContactFormProps = {
  defaultName?: string | null;
  defaultEmail?: string | null;
};

export function ContactForm({ defaultName, defaultEmail }: ContactFormProps) {
  const router = useRouter();
  const [formLoadedAt] = useState(() => Math.floor(Date.now() / 1000));
  const [honeypot, setHoneypot] = useState("");

  const [requirePrivacy, setRequirePrivacy] = useState(true);
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const [type, setType] = useState<InquiryType>("お問い合わせ");
  const [name, setName] = useState(defaultName?.trim() ?? "");
  const [email, setEmail] = useState(defaultEmail?.trim() ?? "");
  const [body, setBody] = useState("");

  const [reproductionSteps, setReproductionSteps] = useState("");
  const [environment, setEnvironment] = useState("");
  const [frequency, setFrequency] = useState("");
  const [responsePriority, setResponsePriority] = useState("");

  const [inquiryCategory, setInquiryCategory] = useState<string>(INQUIRY_CATEGORIES[0]);
  const [preferredContactMethod, setPreferredContactMethod] =
    useState<(typeof CONTACT_METHODS)[number]>("メール");
  const [preferredContactPreset, setPreferredContactPreset] = useState<string>(
    CONTACT_TIME_PRESETS[0],
  );
  const [preferredContactOther, setPreferredContactOther] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [desiredFeatureSummary, setDesiredFeatureSummary] = useState("");
  const [useCaseReason, setUseCaseReason] = useState("");
  const [priority, setPriority] = useState("");

  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchContactFormConfig();
        if (cancelled) return;
        setRequirePrivacy(!!cfg.require_privacy_consent);
        setPrivacyPolicyUrl(
          typeof cfg.privacy_policy_url === "string" && cfg.privacy_policy_url.trim()
            ? cfg.privacy_policy_url.trim()
            : null,
        );
        setConfigError(null);
      } catch (e) {
        if (cancelled) return;
        setConfigError(e instanceof Error ? e.message : "設定の取得に失敗しました。");
        setRequirePrivacy(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const preferredContactTime = useMemo(() => {
    if (preferredContactPreset === "その他（下欄に記入）") {
      const t = preferredContactOther.trim();
      return t ? `その他: ${t}` : "その他";
    }
    return preferredContactPreset;
  }, [preferredContactPreset, preferredContactOther]);

  const trimOrUndefined = (s: string) => {
    const t = s.trim();
    return t ? t : undefined;
  };

  const buildPayload = useCallback((): InquiryPayload | { error: string } => {
    if (honeypot.trim()) {
      return { error: "送信できませんでした。" };
    }

    const n = name.trim();
    const em = email.trim();
    const b = body.trim();
    if (!n) return { error: "お名前を入力してください。" };
    if (n.length > 100) return { error: "お名前は 100 文字以内にしてください。" };
    if (!em) return { error: "メールアドレスを入力してください。" };
    if (em.length > 255) return { error: "メールアドレスが長すぎます。" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      return { error: "メールアドレスの形式が正しくありません。" };
    }
    if (!b) return { error: "お問い合わせ内容を入力してください。" };
    if (b.length > 2000) return { error: "お問い合わせ内容は 2000 文字以内にしてください。" };

    if (requirePrivacy && !privacyConsent) {
      return { error: "プライバシーポリシーに同意してください。" };
    }

    if (type === "お問い合わせ" && preferredContactMethod === "電話") {
      const p = phoneNumber.trim();
      if (!p) return { error: "希望連絡方法が電話のときは電話番号が必須です。" };
      if (p.length > 30) return { error: "電話番号は 30 文字以内にしてください。" };
    }

    const base: InquiryPayload = {
      type,
      app_id: CONTACT_FORM_APP_ID,
      name: n,
      email: em,
      body: b,
      source: CONTACT_FORM_SOURCE,
      form_loaded_at: formLoadedAt,
      website: honeypot,
    };

    if (requirePrivacy) {
      base.privacy_consent = true;
    }

    if (type === "不具合報告") {
      Object.assign(base, {
        reproduction_steps: trimOrUndefined(reproductionSteps),
        environment: trimOrUndefined(environment),
        frequency: trimOrUndefined(frequency),
        response_priority: trimOrUndefined(responsePriority),
      });
    } else if (type === "お問い合わせ") {
      Object.assign(base, {
        inquiry_category: inquiryCategory,
        preferred_contact_method: preferredContactMethod,
        preferred_contact_time: preferredContactTime,
        phone_number: trimOrUndefined(phoneNumber),
      });
    } else {
      Object.assign(base, {
        desired_feature_summary: trimOrUndefined(desiredFeatureSummary),
        use_case_reason: trimOrUndefined(useCaseReason),
        priority: trimOrUndefined(priority),
      });
    }

    return base;
  }, [
    body,
    desiredFeatureSummary,
    email,
    environment,
    formLoadedAt,
    frequency,
    honeypot,
    inquiryCategory,
    name,
    phoneNumber,
    preferredContactMethod,
    preferredContactTime,
    priority,
    privacyConsent,
    reproductionSteps,
    requirePrivacy,
    responsePriority,
    type,
    useCaseReason,
  ]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const payload = buildPayload();
    if ("error" in payload) {
      setSubmitError(payload.error);
      return;
    }

    setPending(true);
    try {
      const result = await postInquiry(payload);
      if (!result.ok) {
        setSubmitError(
          result.status === 429
            ? "送信回数の上限に達しました。しばらく時間をおいてから再度お試しください。"
            : result.message,
        );
        return;
      }
      router.push("/contact/sent");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {configError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {configError}（同意が必要な場合のみチェックを入れて送信してください）
        </p>
      ) : null}

      <div className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="contact-website">ウェブサイト</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="contact-type" className={labelClass}>
          種別
        </label>
        <select
          id="contact-type"
          className={inputClass}
          value={type}
          onChange={(e) => setType(e.target.value as InquiryType)}
        >
          {INQUIRY_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            お名前 <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            className={inputClass}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            メールアドレス <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            className={inputClass}
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-body" className={labelClass}>
          内容 <span className="text-red-600">*</span>
        </label>
        <textarea
          id="contact-body"
          rows={6}
          className={inputClass}
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="できるだけ具体的にご記入ください。"
        />
        <p className="mt-1 text-xs text-zinc-500">{body.length} / 2000 文字</p>
      </div>

      {type === "不具合報告" ? (
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
          <p className="text-sm font-medium text-zinc-800">不具合の詳細（任意）</p>
          <div>
            <label htmlFor="contact-repro" className={labelClass}>
              再現手順
            </label>
            <textarea
              id="contact-repro"
              rows={3}
              className={inputClass}
              value={reproductionSteps}
              onChange={(e) => setReproductionSteps(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="contact-env" className={labelClass}>
              発生環境（端末・ブラウザなど）
            </label>
            <input
              id="contact-env"
              type="text"
              className={inputClass}
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="contact-freq" className={labelClass}>
              発生頻度
            </label>
            <input
              id="contact-freq"
              type="text"
              className={inputClass}
              placeholder="例: 毎回 / たまに / 一度だけ"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="contact-rp" className={labelClass}>
              希望対応
            </label>
            <select
              id="contact-rp"
              className={inputClass}
              value={responsePriority}
              onChange={(e) => setResponsePriority(e.target.value)}
            >
              <option value="">選択してください</option>
              {BUG_RESPONSE_PRIORITY.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {type === "お問い合わせ" ? (
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
          <p className="text-sm font-medium text-zinc-800">お問い合わせの詳細</p>
          <div>
            <label htmlFor="contact-cat" className={labelClass}>
              問い合わせの種類
            </label>
            <select
              id="contact-cat"
              className={inputClass}
              value={inquiryCategory}
              onChange={(e) => setInquiryCategory(e.target.value)}
            >
              {INQUIRY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contact-method" className={labelClass}>
              希望連絡方法
            </label>
            <select
              id="contact-method"
              className={inputClass}
              value={preferredContactMethod}
              onChange={(e) =>
                setPreferredContactMethod(e.target.value as (typeof CONTACT_METHODS)[number])
              }
            >
              {CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contact-time-preset" className={labelClass}>
              希望連絡時間
            </label>
            <select
              id="contact-time-preset"
              className={inputClass}
              value={preferredContactPreset}
              onChange={(e) => setPreferredContactPreset(e.target.value)}
            >
              {CONTACT_TIME_PRESETS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {preferredContactPreset === "その他（下欄に記入）" ? (
              <input
                type="text"
                className={`${inputClass} mt-2`}
                placeholder="ご希望の時間帯を記入"
                value={preferredContactOther}
                onChange={(e) => setPreferredContactOther(e.target.value)}
              />
            ) : null}
          </div>
          {preferredContactMethod === "電話" ? (
            <div>
              <label htmlFor="contact-phone" className={labelClass}>
                電話番号 <span className="text-red-600">*</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                autoComplete="tel"
                className={inputClass}
                maxLength={30}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {type === "機能要望" ? (
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
          <p className="text-sm font-medium text-zinc-800">機能要望の詳細（任意）</p>
          <div>
            <label htmlFor="contact-feature" className={labelClass}>
              希望機能の概要
            </label>
            <textarea
              id="contact-feature"
              rows={3}
              className={inputClass}
              value={desiredFeatureSummary}
              onChange={(e) => setDesiredFeatureSummary(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="contact-usecase" className={labelClass}>
              利用シーン・理由
            </label>
            <textarea
              id="contact-usecase"
              rows={3}
              className={inputClass}
              value={useCaseReason}
              onChange={(e) => setUseCaseReason(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="contact-priority" className={labelClass}>
              優先度
            </label>
            <select
              id="contact-priority"
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">選択してください</option>
              {FEATURE_PRIORITY.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {requirePrivacy ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
            />
            <span>
              <span className="text-red-600">*</span> プライバシーポリシーに同意します。
              {privacyPolicyUrl ? (
                <>
                  {" "}
                  <a
                    href={privacyPolicyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 underline-offset-2 hover:underline"
                  >
                    プライバシーポリシーを開く
                  </a>
                </>
              ) : null}
            </span>
          </label>
        </div>
      ) : null}

      {submitError ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "送信中…" : "送信する"}
        </button>
        <p className="text-xs text-zinc-500">
          送信内容は運営側の問い合わせシステムに記録されます。Bot 対策のため、表示直後の連続送信はブロックされる場合があります。
        </p>
      </div>
    </form>
  );
}
