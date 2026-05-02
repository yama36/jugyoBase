"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost } from "@/app/actions/posts";
import type { Post, PostTag, Tag } from "@prisma/client";
import type { CurriculumUnitOption } from "@/app/actions/posts";
import { PolicyChecklist } from "./PolicyChecklist";
import { AttachmentUploader } from "./AttachmentUploader";

type PostWithTags = (Post & { contentItem?: string | null }) & {
  tags: (PostTag & { tag: Tag })[];
};

const GRADE_OPTIONS = ["1年", "2年", "3年"] as const;
const SUBJECT_OPTIONS = [
  "国語",
  "社会",
  "数学",
  "理科",
  "音楽",
  "美術",
  "保健体育",
  "技術",
  "家庭",
  "英語",
  "道徳",
  "学活",
  "総合",
] as const;

type Props =
  | {
      mode: "create";
      tenantSlug: string;
      curriculumUnits: CurriculumUnitOption[];
      hashtagSuggestions: string[];
    }
  | {
      mode: "edit";
      tenantSlug: string;
      post: PostWithTags;
      curriculumUnits: CurriculumUnitOption[];
      hashtagSuggestions: string[];
    };

export function PostEditor(props: Props) {
  const router = useRouter();
  const tenantSlug = props.tenantSlug;

  const [createState, createAction] = useActionState(createPost, null);
  const [updateState, updateAction] = useActionState(updatePost, null);

  useEffect(() => {
    if (createState?.ok) {
      router.push(`/t/${tenantSlug}/posts/${createState.postId}/edit`);
    }
  }, [createState, router, tenantSlug]);

  useEffect(() => {
    if (updateState?.ok) {
      router.refresh();
    }
  }, [updateState, router]);

  const action = props.mode === "create" ? createAction : updateAction;
  const state = props.mode === "create" ? createState : updateState;

  const p = props.mode === "edit" ? props.post : null;
  const hashtagsInitial =
    p?.tags.map((pt) => `#${pt.tag.name}`).join(" ") ?? "";
  const [grade, setGrade] = useState<string>(p?.grade ?? "");
  const [subject, setSubject] = useState<string>(p?.subject ?? "");
  const [unit, setUnit] = useState<string>(p?.unit ?? "");

  const filteredUnits = useMemo(() => {
    return props.curriculumUnits.filter((u) => u.grade === grade && u.subject === subject);
  }, [grade, props.curriculumUnits, subject]);

  const unitOptions = useMemo(() => {
    const unique = new Set(filteredUnits.map((u) => u.name));
    if (p?.unit) unique.add(p.unit);
    return Array.from(unique);
  }, [filteredUnits, p?.unit]);

  useEffect(() => {
    if (!unit) return;
    if (!unitOptions.includes(unit)) {
      setUnit("");
    }
  }, [unit, unitOptions]);

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        {props.mode === "edit" ? (
          <input type="hidden" name="postId" value={props.post.id} />
        ) : null}

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
              onChange={(e) => setGrade(e.target.value)}
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
              onChange={(e) => setSubject(e.target.value)}
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
            単元・内容項目 <span className="text-red-600">*</span>
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            候補から選ぶか、候補にない場合はそのまま入力できます。
          </p>
          <input
            name="unit"
            required
            list="unit-suggestions"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={!grade || !subject}
            placeholder={!grade || !subject ? "先に学年と教科を選択してください" : "単元を入力"}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-zinc-100"
          />
          <datalist id="unit-suggestions">
            {unitOptions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            めあて <span className="text-red-600">*</span>
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            生徒が「この授業で何ができるようになるか」
          </p>
          <textarea
            name="aim"
            required
            rows={4}
            defaultValue={p?.aim ?? ""}
            placeholder="例: 連立方程式を使って、買い物の問題を自分で解けるようになる。"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            振り返り <span className="text-red-600">*</span>
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            生徒が「できたこと・難しかったこと・次に頑張ること」
          </p>
          <textarea
            name="reflection"
            rows={4}
            required
            defaultValue={p?.reflection ?? ""}
            placeholder="例: 式を立てるところで迷った。次は条件を表に整理してから取り組みたい。"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            工夫した点（POINT） <span className="text-red-600">*</span>
          </label>
          <textarea
            name="point"
            required
            rows={3}
            defaultValue={p?.point ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            簡単な授業の流れ <span className="text-red-600">*</span>
          </label>
          <textarea
            name="flow"
            required
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

        {state && !state.ok ? (
          <p className="text-sm text-red-600">{state.message}</p>
        ) : null}

        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {props.mode === "create" ? "保存して次へ（添付）" : "更新する"}
        </button>
      </form>

      {props.mode === "edit" ? (
        <AttachmentUploader tenantSlug={tenantSlug} postId={props.post.id} />
      ) : null}
    </div>
  );
}
