"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePost } from "@/app/actions/posts";
import type { Attachment, Post, PostTag, Tag } from "@prisma/client";
import type { CurriculumUnitOption } from "@/app/actions/posts";
import { PolicyChecklist } from "./PolicyChecklist";
import {
  AttachmentUploader,
  type AttachmentListItem,
} from "./AttachmentUploader";
import {
  curriculumUnitMatchesSelection,
  GRADE_OPTIONS,
  isCommonGradeOrSubjectSelection,
  SUBJECT_OPTIONS,
} from "@/lib/subject-grade-options";

type PostWithTags = (Post & { contentItem?: string | null }) & {
  tags: (PostTag & { tag: Tag })[];
  attachments: Attachment[];
};

type Props =
  | {
      mode: "create";
      tenantSlug: string;
      /** ページ表示時にサーバーが用意した空下書き（添付は保存前から可能） */
      draftPostId: string;
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
  const p = props.mode === "edit" ? props.post : null;
  const hashtagsInitial =
    p?.tags.map((pt) => `#${pt.tag.name}`).join(" ") ?? "";
  const [grade, setGrade] = useState<string>(p?.grade ?? "");
  const [subject, setSubject] = useState<string>(p?.subject ?? "");
  const [unit, setUnit] = useState<string>(p?.unit ?? "");
  const [contentItem, setContentItem] = useState<string>(p?.contentItem?.trim() ?? "");
  const [category, setCategory] = useState<string>(
    (p as (Post & { category?: string }) | null)?.category ?? "授業",
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
  const subjectRequired = category === "授業";
  const unitRequired =
    category === "授業" &&
    unitFieldsReady &&
    !isCommonGradeOrSubjectSelection(grade, subject);
  const showUnitSelect = unitFieldsReady && unitInputMode === "select" && unitOptions.length > 0;
  const sectionLabels =
    category === "業務改善"
      ? {
          aim: "課題・背景",
          reflection: "効果・結果",
          point: "試みたこと（ツール名など）",
          flow: "気をつける点",
        }
      : category === "AI・ICT活用"
        ? {
            aim: "活用場面",
            reflection: "よかった点・気をつけた点",
            point: "使用したAI・ツール名",
            flow: "使ったプロンプト例",
          }
        : {
            aim: "めあて",
            reflection: "振り返り",
            point: "工夫した点（POINT）",
            flow: "簡単な授業の流れ",
          };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <AttachmentUploader
          tenantSlug={tenantSlug}
          postId={postId}
          initialAttachments={initialAttachments}
          storageConfigured={props.storageConfigured ?? true}
          malwareScanGate={props.malwareScanGate ?? false}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <input
          type="hidden"
          name="postId"
          value={props.mode === "create" ? props.draftPostId : props.post.id}
        />

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            カテゴリ <span className="text-red-600">*</span>
          </label>
          <select
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            <option value="授業">授業</option>
            <option value="業務改善">業務改善</option>
            <option value="AI・ICT活用">AI・ICT活用</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            タイトル <span className="text-red-600">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            defaultValue={p?.title ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            maxLength={200}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
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
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium text-zinc-700">
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
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="" disabled>
                選択してください
              </option>
              {SUBJECT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            単元{" "}
            {unitRequired ? (
              <span className="text-red-600">*</span>
            ) : unitFieldsReady ? (
              <span className="text-xs font-normal text-zinc-500">（任意）</span>
            ) : null}
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            {category !== "授業"
              ? "業務改善・AI/ICT活用では単元は任意です。必要な場合のみ入力してください。"
              : unitRequired
              ? "候補から選ぶか、候補にない場合は自由入力できます。学年・教科が「共通」の単元は、該当する組み合わせの候補にも表示されます。"
              : "学年または教科が「共通」の場合、単元の入力は任意です。"}
          </p>
          {!unitFieldsReady ? (
            <input
              disabled
              placeholder="先に学年と教科を選択してください"
              className="mt-1 w-full rounded border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm disabled:cursor-not-allowed"
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
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
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
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
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
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">{sectionLabels.aim}</label>
          <textarea
            name="aim"
            rows={4}
            defaultValue={p?.aim ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            {sectionLabels.reflection}
          </label>
          <textarea
            name="reflection"
            rows={4}
            defaultValue={p?.reflection ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">{sectionLabels.point}</label>
          <textarea
            name="point"
            rows={3}
            defaultValue={p?.point ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">{sectionLabels.flow}</label>
          <textarea
            name="flow"
            rows={4}
            defaultValue={p?.flow ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            ハッシュタグ（#は不要。スペース・カンマ区切り）
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            入力時に # を付けなくても、保存時にハッシュタグとして扱われます。
          </p>
          <input
            name="hashtags"
            type="text"
            list="hashtag-suggestions"
            defaultValue={hashtagsInitial}
            placeholder="例: 協同学習 国語 振り返り"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <datalist id="hashtag-suggestions">
            {props.hashtagSuggestions.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            参考URL（任意）
          </label>
          <input
            name="referenceUrl"
            type="url"
            defaultValue={(p as (Post & { referenceUrl?: string | null }) | null)?.referenceUrl ?? ""}
            placeholder="https://example.com/"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
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
            defaultChecked={props.mode === "edit" ? p?.isPublished === false : false}
          />
          <span>下書きとして保存する（一覧に表示されません）</span>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          保存する
        </button>
      </form>
      </section>
    </div>
  );
}
