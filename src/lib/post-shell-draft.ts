import type { Prisma } from "@prisma/client";

/**
 * 新規投稿画面用の「まだフォーム未保存の空下書き」と listPosts / DB で一致させるためのスカラー条件。
 */
const DEFAULT_SHELL_CATEGORY = "授業";

const newPostShellDraftScalarWhere: Pick<
  Prisma.PostWhereInput,
  | "isPublished"
  | "category"
  | "title"
  | "grade"
  | "subject"
  | "unit"
  | "aim"
  | "contentItem"
  | "reflection"
  | "point"
  | "flow"
  | "referenceUrl"
> = {
  isPublished: false,
  category: DEFAULT_SHELL_CATEGORY,
  title: null,
  grade: "",
  subject: "",
  unit: "",
  aim: "",
  contentItem: null,
  reflection: null,
  point: null,
  flow: null,
  referenceUrl: null,
};

export function newPostShellDraftWhere(authorId: string): Prisma.PostWhereInput {
  return { authorId, ...newPostShellDraftScalarWhere };
}

type ShellDraftShape = {
  isPublished: boolean;
  category?: string | null;
  title: string | null;
  grade: string;
  subject: string;
  unit: string;
  aim: string;
  contentItem: string | null;
  reflection: string | null;
  point: string | null;
  flow: string | null;
  referenceUrl?: string | null;
};

/** マイページの下書き一覧などから除外する「新規用シェル下書き」か */
export function isNewPostShellDraft(p: ShellDraftShape): boolean {
  if (p.isPublished !== false) return false;
  const category = p.category ?? DEFAULT_SHELL_CATEGORY;
  return (
    category === DEFAULT_SHELL_CATEGORY &&
    p.title == null &&
    p.grade === "" &&
    p.subject === "" &&
    p.unit === "" &&
    p.aim === "" &&
    p.contentItem == null &&
    p.reflection == null &&
    p.point == null &&
    p.flow == null &&
    (p.referenceUrl == null || p.referenceUrl === "")
  );
}
