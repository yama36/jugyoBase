"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePost } from "@/app/actions/posts";
import type { Post, PostTag, Tag } from "@prisma/client";
import type { CurriculumUnitOption } from "@/app/actions/posts";
import { PolicyChecklist } from "./PolicyChecklist";
import { AttachmentUploader } from "./AttachmentUploader";
import { GRADE_OPTIONS, SUBJECT_OPTIONS } from "@/lib/subject-grade-options";

type PostWithTags = (Post & { contentItem?: string | null }) & {
  tags: (PostTag & { tag: Tag })[];
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
    }
  | {
      mode: "edit";
      tenantSlug: string;
      post: PostWithTags;
      curriculumUnits: CurriculumUnitOption[];
      hashtagSuggestions: string[];
      malwareScanGate?: boolean;
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
  const [unitInputMode, setUnitInputMode] = useState<"select" | "custom">(() => {
    const g = p?.grade ?? "";
    const s = p?.subject ?? "";
    const u = p?.unit ?? "";
    const names = props.curriculumUnits
      .filter((cu) => cu.grade === g && cu.subject === s)
      .map((cu) => cu.name);
    if (names.length === 0) return "custom";
    if (u && !names.includes(u)) return "custom";
    return "select";
  });

  const postId = props.mode === "create" ? props.draftPostId : props.post.id;

  const filteredUnits = useMemo(() => {
    return props.curriculumUnits.filter((u) => u.grade === grade && u.subject === subject);
  }, [grade, props.curriculumUnits, subject]);

  const unitOptions = useMemo(() => {
    const unique = new Set(filteredUnits.map((u) => u.name));
    return Array.from(unique);
  }, [filteredUnits]);

  const unitFieldsReady = Boolean(grade && subject);
  const showUnitSelect = unitFieldsReady && unitInputMode === "select" && unitOptions.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <AttachmentUploader
          tenantSlug={tenantSlug}
          postId={postId}
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
              学年 <span className="text-red-600">*</span>
            </label>
            <select
              name="grade"
              required
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
              教科 <span className="text-red-600">*</span>
            </label>
            <select
              name="subject"
              required
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
            単元 <span className="text-red-600">*</span>
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            候補から選ぶか、候補にない場合は自由入力できます。
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
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    単元を選択してください
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
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="単元を入力"
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
              !grade || !subject ? "先に学年と教科を選択してください" : "例: 連立方程式（なければ空のままでも構いません）"
            }
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">めあて</label>
          <p className="mt-1 text-xs text-zinc-500">
            生徒が「この授業で何ができるようになるか」
          </p>
          <textarea
            name="aim"
            rows={4}
            defaultValue={p?.aim ?? ""}
            placeholder="例: 連立方程式を使って、買い物の問題を自分で解けるようになる。"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">振り返り</label>
          <p className="mt-1 text-xs text-zinc-500">
            生徒が「できたこと・難しかったこと・次に頑張ること」
          </p>
          <textarea
            name="reflection"
            rows={4}
            defaultValue={p?.reflection ?? ""}
            placeholder="例: 式を立てるところで迷った。次は条件を表に整理してから取り組みたい。"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            工夫した点（POINT）
          </label>
          <textarea
            name="point"
            rows={3}
            defaultValue={p?.point ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            簡単な授業の流れ
          </label>
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
