"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { autosaveDraftPost } from "@/app/actions/drafts";
import { updatePost } from "@/app/actions/posts";
import type { Attachment, Post, PostTag, Tag } from "@prisma/client";
import type { CurriculumUnitOption } from "@/lib/queries/posts";
import { PolicyChecklist } from "./PolicyChecklist";
import {
  AttachmentUploader,
  type AttachmentListItem,
} from "./AttachmentUploader";
import {
  curriculumUnitMatchesSelection,
  GRADE_OPTIONS,
  AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT,
  isCommonGradeOrSubjectSelection,
} from "@/lib/subject-grade-options";
import {
  AI_ICT_CATEGORY,
  getPostSectionLabels,
  normalizePostCategory,
  normalizePostSubject,
  subjectRequiredForCategory,
  subjectSelectOptions,
} from "@/lib/post-category";
import {
  TRANSFER_SKILL_ORIGIN_OPTIONS,
  type TransferSkillOrigin,
} from "@/lib/transfer-reflection";
import {
  formFieldClass,
  formLabelClass,
  formSelectClass,
  formTextareaClass,
  formTextareaShortClass,
} from "@/lib/form-classes";

type PostWithTags = (Post & {
  contentItem?: string | null;
  isAiIctLesson?: boolean;
  transferStrength?: string | null;
  transferSkillOrigins?: string[];
  transferSkillOriginOther?: string | null;
  transferMotivation?: string | null;
}) & {
  tags: (PostTag & { tag: Tag })[];
  attachments: Attachment[];
};

type Props =
  | {
      mode: "create";
      tenantSlug: string;
      /** ページ表示時にサーバーが用意した空下書き（添付は保存前から可能） */
      draftPostId: string;
      /** 自動保存済みの下書き内容（再訪時の復元用） */
      initialDraft?: PostWithTags | null;
      curriculumUnits: CurriculumUnitOption[];
      hashtagSuggestions: string[];
      /** `MALWARE_SCAN_WEBHOOK_SECRET` 設定時 true（サーバーから渡す） */
      malwareScanGate?: boolean;
      storageConfigured?: boolean;
      initialAttachments?: AttachmentListItem[];
    }
  | {
      mode: "edit";
      tenantSlug: string;
      post: PostWithTags;
      curriculumUnits: CurriculumUnitOption[];
      hashtagSuggestions: string[];
      malwareScanGate?: boolean;
      storageConfigured?: boolean;
    };

export function PostEditor(props: Props) {
  const router = useRouter();
  const tenantSlug = props.tenantSlug;

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const isDraft = fd.get("isDraft") === "on";
    const postId = String(fd.get("postId") ?? "");

    startTransition(async () => {
      setError(null);
      const r = await updatePost(null, fd);
      if (!r.ok) {
        setError(r.message);
        return;
      }

      if (props.mode === "create") {
        if (isDraft) {
          toast.success("下書きに保存しました。", { id: "post-draft-saved" });
          router.push(`/t/${tenantSlug}/mypage`);
        } else {
          router.push(`/t/${tenantSlug}/posts/${postId}/complete`);
        }
        return;
      }

      router.push(`/t/${tenantSlug}/posts/${props.post.id}`);
    });
  }
  const p =
    props.mode === "edit"
      ? props.post
      : (props.initialDraft ?? null);
  const formRef = useRef<HTMLFormElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hashtagsInitial =
    p?.tags.map((pt) => `#${pt.tag.name}`).join(" ") ?? "";
  const [grade, setGrade] = useState<string>(p?.grade ?? "");
  const rawCategory = (p as (Post & { category?: string }) | null)?.category;
  const [category, setCategory] = useState<string>(
    normalizePostCategory(rawCategory),
  );
  const [subject, setSubject] = useState<string>(
    normalizePostSubject(rawCategory, p?.subject),
  );
  const [unit, setUnit] = useState<string>(p?.unit ?? "");
  const [contentItem, setContentItem] = useState<string>(p?.contentItem?.trim() ?? "");
  const [isAiIctLesson, setIsAiIctLesson] = useState<boolean>(p?.isAiIctLesson ?? false);
  const [transferStrength, setTransferStrength] = useState<string>(
    p?.transferStrength ?? "",
  );
  const [transferSkillOrigins, setTransferSkillOrigins] = useState<
    TransferSkillOrigin[]
  >((p?.transferSkillOrigins ?? []).filter((v): v is TransferSkillOrigin =>
    TRANSFER_SKILL_ORIGIN_OPTIONS.includes(v as TransferSkillOrigin),
  ));
  const [transferSkillOriginOther, setTransferSkillOriginOther] = useState<string>(
    p?.transferSkillOriginOther ?? "",
  );
  const [transferMotivation, setTransferMotivation] = useState<string>(
    p?.transferMotivation ?? "",
  );
  const [isDraft, setIsDraft] = useState<boolean>(
    props.mode === "edit" ? p?.isPublished === false : false,
  );
  const [unitInputMode, setUnitInputMode] = useState<"select" | "custom">(() => {
    const g = p?.grade ?? "";
    const s = p?.subject ?? "";
    const u = p?.unit ?? "";
    const names = props.curriculumUnits
      .filter((cu) => curriculumUnitMatchesSelection(g, s, cu))
      .map((cu) => cu.name);
    if (names.length === 0) return "custom";
    if (u && !names.includes(u)) return "custom";
    return "select";
  });

  const postId = props.mode === "create" ? props.draftPostId : props.post.id;

  useEffect(() => {
    if (props.mode !== "create") return;
    const form = formRef.current;
    if (!form) return;

    const scheduleAutosave = () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(async () => {
        const fd = new FormData(form);
        const r = await autosaveDraftPost(fd);
        if (!r.ok) {
          toast.error(r.message, { id: "post-autosave-error" });
        }
      }, 2000);
    };

    form.addEventListener("input", scheduleAutosave);
    form.addEventListener("change", scheduleAutosave);
    return () => {
      form.removeEventListener("input", scheduleAutosave);
      form.removeEventListener("change", scheduleAutosave);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [props.mode, postId]);

  const initialAttachments: AttachmentListItem[] =
    props.mode === "edit"
      ? props.post.attachments.map((a) => ({
          id: a.id,
          kind: a.kind,
          originalFilename: a.originalFilename,
          sizeBytes: a.sizeBytes,
          malwareScanStatus: a.malwareScanStatus,
        }))
      : (props.initialAttachments ?? []);

  const filteredUnits = useMemo(() => {
    return props.curriculumUnits.filter((u) =>
      curriculumUnitMatchesSelection(grade, subject, u),
    );
  }, [grade, props.curriculumUnits, subject]);

  const unitOptions = useMemo(() => {
    const unique = new Set(filteredUnits.map((u) => u.name));
    return Array.from(unique);
  }, [filteredUnits]);

  const unitFieldsReady = Boolean(grade && subject);
  const gradeRequired = category === "授業";
  const subjectRequired = subjectRequiredForCategory(category);
  const subjectOptions = subjectSelectOptions(category);
  const unitRequired =
    category === "授業" &&
    unitFieldsReady &&
    !isCommonGradeOrSubjectSelection(grade, subject);
  const showUnitSelect = unitFieldsReady && unitInputMode === "select" && unitOptions.length > 0;
  const showAiIctLessonOption = category === "授業";
  const transferReflectionRequired = showAiIctLessonOption && isAiIctLesson && !isDraft;
  const needsOtherOriginNote = transferSkillOrigins.includes("その他");
  const transferReflectionIncomplete =
    transferReflectionRequired &&
    (!transferStrength.trim() ||
      transferSkillOrigins.length === 0 ||
      (needsOtherOriginNote && !transferSkillOriginOther.trim()) ||
      !transferMotivation.trim());

  function toggleTransferSkillOrigin(origin: TransferSkillOrigin) {
    setTransferSkillOrigins((prev) =>
      prev.includes(origin)
        ? prev.filter((v) => v !== origin)
        : [...prev, origin],
    );
  }

  const sectionLabels = getPostSectionLabels(category, subject);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <AttachmentUploader
          tenantSlug={tenantSlug}
          postId={postId}
          initialAttachments={initialAttachments}
          returnFrom={props.mode === "create" ? "new" : undefined}
          storageConfigured={props.storageConfigured ?? true}
          malwareScanGate={props.malwareScanGate ?? false}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        {props.mode === "create" ? (
          <p className="text-xs text-zinc-500">
            入力内容は自動で下書き保存されます（ポリシー同意前でも保存されます）。
          </p>
        ) : null}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <input
          type="hidden"
          name="postId"
          value={props.mode === "create" ? props.draftPostId : props.post.id}
        />

        <div>
          <label className={formLabelClass}>
            カテゴリ <span className="text-red-600">*</span>
          </label>
          <select
            name="category"
            required
            value={category}
            onChange={(e) => {
              const next = e.target.value;
              setCategory(next);
              if (next === "授業" && subject === AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT) {
                setSubject("");
                setUnit("");
              }
              if (next !== "授業") {
                setIsAiIctLesson(false);
              }
            }}
            className={formSelectClass}
          >
            <option value="授業">授業</option>
            <option value={AI_ICT_CATEGORY}>AI / ICT活用</option>
          </select>
        </div>

        <div>
          <label className={formLabelClass}>
            タイトル <span className="text-red-600">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            defaultValue={p?.title ?? ""}
            className={formFieldClass}
            maxLength={200}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={formLabelClass}>
              学年{" "}
              {gradeRequired ? (
                <span className="text-red-600">*</span>
              ) : (
                <span className="text-xs font-normal text-zinc-500">（任意）</span>
              )}
            </label>
            <select
              name="grade"
              required={gradeRequired}
              value={grade}
              onChange={(e) => {
                setGrade(e.target.value);
                setUnit("");
                setUnitInputMode("select");
              }}
              className={formSelectClass}
            >
              <option value="" disabled>
                選択してください
              </option>
              {GRADE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={formLabelClass}>
              教科{" "}
              {subjectRequired ? (
                <span className="text-red-600">*</span>
              ) : (
                <span className="text-xs font-normal text-zinc-500">（任意）</span>
              )}
            </label>
            <select
              name="subject"
              required={subjectRequired}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setUnit("");
                setUnitInputMode("select");
              }}
              className={formSelectClass}
            >
              <option value="" disabled>
                選択してください
              </option>
              {subjectOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={formLabelClass}>
            単元{" "}
            {unitRequired ? (
              <span className="text-red-600">*</span>
            ) : unitFieldsReady ? (
              <span className="text-xs font-normal text-zinc-500">（任意）</span>
            ) : null}
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            {category !== "授業"
              ? "AI / ICT活用では単元は任意です。必要な場合のみ入力してください。"
              : unitRequired
              ? "候補から選ぶか、候補にない場合は自由入力できます。学年・教科が「共通」の単元は、該当する組み合わせの候補にも表示されます。"
              : "学年または教科が「共通」の場合、単元の入力は任意です。"}
          </p>
          {!unitFieldsReady ? (
            <input
              disabled
              placeholder="先に学年と教科を選択してください"
              className={`${formFieldClass} bg-zinc-100 disabled:cursor-not-allowed`}
            />
          ) : (
            <div className="mt-2 space-y-2">
              {unitOptions.length > 0 ? (
                <div className="flex flex-wrap gap-4 text-sm text-zinc-700">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="unitInputMode"
                      checked={unitInputMode === "select"}
                      onChange={() => {
                        setUnitInputMode("select");
                        if (!unitOptions.includes(unit)) setUnit("");
                      }}
                      className="text-sky-600"
                    />
                    候補から選ぶ
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="unitInputMode"
                      checked={unitInputMode === "custom"}
                      onChange={() => setUnitInputMode("custom")}
                      className="text-sky-600"
                    />
                    自由入力
                  </label>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  この学年・教科の候補はまだ登録されていません。単元名を直接入力してください。
                </p>
              )}
              {showUnitSelect ? (
                <select
                  name="unit"
                  required={unitRequired}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={formSelectClass}
                >
                  <option value="" disabled={unitRequired}>
                    {unitRequired ? "単元を選択してください" : "（未選択）"}
                  </option>
                  {unitOptions.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name="unit"
                  required={unitRequired}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={unitRequired ? "単元を入力" : "単元を入力（任意）"}
                  className={formFieldClass}
                />
              )}
            </div>
          )}
        </div>

        <div>
          <label className={formLabelClass}>
            内容項目（任意）
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            指導要領上の細目や、単元内の小トピックがあれば入力できます。
          </p>
          <input
            name="contentItem"
            type="text"
            value={contentItem}
            onChange={(e) => setContentItem(e.target.value)}
            disabled={!grade || !subject}
            maxLength={500}
            placeholder={
              !grade || !subject
                ? "先に学年と教科を選択してください"
                : "例: 連立方程式（なければ空のままでも構いません）"
            }
            className={`${formFieldClass} disabled:cursor-not-allowed disabled:bg-zinc-100`}
          />
        </div>

        <div>
          <label className={formLabelClass}>{sectionLabels.aim}</label>
          <textarea
            name="aim"
            rows={5}
            defaultValue={p?.aim ?? ""}
            className={formTextareaClass}
          />
        </div>

        <div>
          <label className={formLabelClass}>
            {sectionLabels.reflection}
          </label>
          <textarea
            name="reflection"
            rows={5}
            defaultValue={p?.reflection ?? ""}
            className={formTextareaClass}
          />
        </div>

        <div>
          <label className={formLabelClass}>{sectionLabels.point}</label>
          <textarea
            name="point"
            rows={4}
            defaultValue={p?.point ?? ""}
            className={formTextareaClass}
          />
        </div>

        <div>
          <label className={formLabelClass}>{sectionLabels.flow}</label>
          <textarea
            name="flow"
            rows={5}
            defaultValue={p?.flow ?? ""}
            className={formTextareaClass}
          />
        </div>

        {showAiIctLessonOption ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-zinc-800">
            <input
              type="checkbox"
              name="isAiIctLesson"
              checked={isAiIctLesson}
              onChange={(e) => setIsAiIctLesson(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              この授業はAI/ICTを活用しました
              <span className="mt-1 block text-xs font-normal text-zinc-500">
                ONにすると、授業実践に関する短いアンケート（3項目）が表示されます。回答は研究分析用であり、他の教員には公開されません。
              </span>
            </span>
          </label>

          {isAiIctLesson ? (
            <div className="mt-4 space-y-4 border-t border-zinc-200 pt-4">
              <p className="text-xs text-zinc-500">
                授業の記録（上記のめあて・振り返りなど）はこれまでどおり共有されます。以下はアンケートとして別途保存されます。
              </p>
              <div>
                <label className={formLabelClass}>
                  今回の授業で工夫できた・うまく使えたと感じる力{" "}
                  <span className="text-red-600">*</span>
                </label>
                <p className="mt-1 text-xs text-zinc-500">
                  短文でも構いません。例：プロンプトの工夫、出力の検証、課題の分解 など
                </p>
                <textarea
                  name="transferStrength"
                  rows={4}
                  required={transferReflectionRequired}
                  value={transferStrength}
                  onChange={(e) => setTransferStrength(e.target.value)}
                  placeholder="例：生徒の回答をその場で検証し、誤りを見つける力"
                  className={formTextareaShortClass}
                  maxLength={5000}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-700">
                  その力は主にどんな場面で身につけた／鍛えたと思うか{" "}
                  <span className="text-red-600">*</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">1つ以上選択してください</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  {TRANSFER_SKILL_ORIGIN_OPTIONS.map((origin) => (
                    <label
                      key={origin}
                      className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700"
                    >
                      <input
                        type="checkbox"
                        name="transferSkillOrigins"
                        value={origin}
                        checked={transferSkillOrigins.includes(origin)}
                        onChange={() => toggleTransferSkillOrigin(origin)}
                        className="text-sky-600"
                      />
                      {origin}
                    </label>
                  ))}
                </div>
                {needsOtherOriginNote ? (
                  <div className="mt-3">
                    <label className={formLabelClass}>
                      「その他」の補足 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="transferSkillOriginOther"
                      value={transferSkillOriginOther}
                      onChange={(e) => setTransferSkillOriginOther(e.target.value)}
                      required={transferReflectionRequired}
                      placeholder="例：部活動の顧問業務"
                      className={formFieldClass}
                      maxLength={500}
                    />
                  </div>
                ) : null}
              </div>

              <div>
                <label className={formLabelClass}>
                  なぜこの授業でその力・AI活用を使おうと思ったか{" "}
                  <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="transferMotivation"
                  rows={3}
                  required={transferReflectionRequired}
                  value={transferMotivation}
                  onChange={(e) => setTransferMotivation(e.target.value)}
                  placeholder="例：前回の振り返りで、生徒の思考を引き出す工夫が足りないと感じたため"
                  className={formTextareaShortClass}
                  maxLength={5000}
                />
              </div>

              {transferReflectionIncomplete ? (
                <p className="text-sm text-red-600">
                  AI/ICT活用授業として投稿するには、アンケート3項目をすべて入力してください。
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        ) : null}

        <div>
          <label className={formLabelClass}>
            ハッシュタグ（#は不要。スペース・カンマ・読点などで区切り）
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            スペース・カンマ（,，）・読点（、）・セミコロン・スラッシュなどで区切れます。# を付けなくても保存時にハッシュタグとして扱われます。
          </p>
          <input
            name="hashtags"
            type="text"
            list="hashtag-suggestions"
            defaultValue={hashtagsInitial}
            placeholder="例: 協同学習 国語 振り返り"
            className={formFieldClass}
          />
          <datalist id="hashtag-suggestions">
            {props.hashtagSuggestions.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={formLabelClass}>
            参考URL（任意）
          </label>
          <input
            name="referenceUrl"
            type="url"
            defaultValue={(p as (Post & { referenceUrl?: string | null }) | null)?.referenceUrl ?? ""}
            placeholder="https://example.com/"
            className={formFieldClass}
          />
        </div>

        <PolicyChecklist />

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="policyAccepted" required className="mt-1" />
          <span>上記ポリシーと学校の運用に従い、適切な内容のみを投稿します</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            name="isDraft"
            className="mt-0.5"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
          />
          <span>下書きとして保存する（一覧に表示されません）</span>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending || transferReflectionIncomplete}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          保存する
        </button>
      </form>
      </section>
    </div>
  );
}
