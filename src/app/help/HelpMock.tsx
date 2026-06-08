import { PostMetaBadges } from "@/components/PostMetaBadges";

/**
 * /help ページの MDX 内で使う「擬似 UI モック」。
 *
 * 実画面のキャプチャ画像を貼る代わりに、Tailwind で本物っぽい見た目を
 * 再現する div を表示する。実装画面のクラス・配色・余白に合わせている。
 *
 * - 動的レイアウトでスクリーンショット保守の手間が無い
 * - 実画面の Tailwind クラスを流用しているので、見た目の差は最小
 * - キーボード操作・スクリーンリーダーには「画像」ではなく見出し付きの装飾領域として読まれる
 */

type Variant =
  | "school-list"
  | "post-list"
  | "post-form"
  | "policy-check"
  | "comment-form"
  | "notification-bell"
  | "mypage"
  | "summary";

const VARIANT_TITLES: Record<Variant, string> = {
  "school-list": "トップ：学校（テナント）の選択",
  "post-list": "事例一覧と検索条件",
  "post-form": "新規投稿フォーム",
  "policy-check": "投稿前の確認（ポリシーチェック）",
  "comment-form": "コメント欄の入力 UI",
  "notification-bell": "ヘッダーの通知ベル",
  mypage: "マイページの構成",
  summary: "教科別の共有マップ",
};

export function HelpMock({
  variant,
  caption,
}: {
  variant: Variant;
  caption?: string;
}) {
  const title = caption ?? VARIANT_TITLES[variant];

  return (
    <figure
      className="mt-5"
      aria-label={`画面イメージ：${title}`}
    >
      <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm">
        <FrameChrome />
        <div className="px-4 py-5 sm:px-6">{renderMock(variant)}</div>
      </div>
      <figcaption className="mt-1.5 text-xs text-zinc-500">
        画面イメージ：{title}
      </figcaption>
    </figure>
  );
}

function FrameChrome() {
  return (
    <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-white px-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      <span className="ml-3 truncate text-[11px] text-zinc-400">
        jugyoBase
      </span>
    </div>
  );
}

function renderMock(variant: Variant) {
  switch (variant) {
    case "school-list":
      return <SchoolListMock />;
    case "post-list":
      return <PostListMock />;
    case "post-form":
      return <PostFormMock />;
    case "policy-check":
      return <PolicyCheckMock />;
    case "comment-form":
      return <CommentFormMock />;
    case "notification-bell":
      return <NotificationBellMock />;
    case "mypage":
      return <MyPageMock />;
    case "summary":
      return <SummaryMock />;
  }
}

function SchoolListMock() {
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <div>
        <p className="text-base font-semibold tracking-tight text-zinc-900">
          jugyoBase
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          学校（テナント）を選んでログインします。
        </p>
      </div>
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {["○○小学校", "○○中学校", "△△高等学校"].map((name) => (
          <li
            key={name}
            className="px-4 py-3 text-sm font-medium text-zinc-900"
          >
            {name}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-zinc-500">
        はじめての方は{" "}
        <span className="text-sky-700 underline-offset-2">使い方</span> を
        ご覧ください。
      </p>
    </div>
  );
}

function PostListMock() {
  return (
    <div className="space-y-4">
      <div className="space-y-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">事例一覧</p>
            <p className="text-[11px] text-zinc-500">
              AIを特別なものにせず、日々の授業準備・実践で使い、校内で知見を共有していきましょう。
            </p>
          </div>
          <span className="rounded bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white">
            新規投稿
          </span>
        </div>
        <div className="mt-3 rounded-lg border border-sky-200 bg-linear-to-br from-sky-50 to-white p-3 shadow-sm ring-1 ring-sky-100/80">
          <span className="flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white sm:inline-flex sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-sky-800">
            教科別の共有マップを見る →
          </span>
          <p className="mt-1.5 text-center text-[10px] text-zinc-500 sm:text-left">
            教科ごとの投稿数と単元マップを確認できます
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-medium text-zinc-700">
          <span className="flex items-center gap-1.5">
            <span className="text-zinc-400">▸</span>
            検索条件
            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-800">
              条件あり
            </span>
          </span>
          <span className="text-[10px] text-zinc-400">開く</span>
        </div>
      </div>

      <ul className="space-y-2">
        {SAMPLE_POSTS.map((post) => (
          <li
            key={post.title}
            className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm"
          >
            <div className="flex gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50">
                {post.thumb === "PDF" ? (
                  <span className="rounded bg-red-100 px-1 py-0.5 text-[10px] font-semibold text-red-700">
                    PDF
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400">{post.thumb}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {post.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-zinc-400">
                    {post.date}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px]">
                    <span className="text-zinc-500">カテゴリ</span>
                    <span className="font-medium text-zinc-800">{post.category}</span>
                  </span>
                  <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-800">
                    {post.grade}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800">
                    {post.subject}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px]">
                    <span className="text-amber-600">単元</span>
                    <span className="font-medium text-amber-900">{post.unit}</span>
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] text-sky-700">
                  {post.tags.map((t) => `#${t}`).join(" ")}
                </p>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-400">
                  <span>♥ {post.likes}</span>
                  <span>試した {post.tried}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SAMPLE_POSTS: ReadonlyArray<{
  title: string;
  thumb: string;
  date: string;
  category: string;
  grade: string;
  subject: string;
  unit: string;
  tags: string[];
  likes: number;
  tried: number;
  comments: number;
}> = [
  {
    title: "連立方程式：買い物の場面で式を立てる",
    thumb: "PDF",
    date: "2026/05/10",
    category: "授業",
    grade: "2年",
    subject: "数学",
    unit: "連立方程式",
    tags: ["協同学習", "ICT"],
    likes: 4,
    tried: 2,
    comments: 2,
  },
  {
    title: "走れメロスを「友情」の視点で読み直す",
    thumb: "JPG",
    date: "2026/05/08",
    category: "授業",
    grade: "2年",
    subject: "国語",
    unit: "走れメロス",
    tags: ["読解", "対話"],
    likes: 7,
    tried: 1,
    comments: 1,
  },
];

function PostFormMock() {
  return (
    <div className="space-y-4">
      <div className="space-y-2.5 rounded-lg border border-zinc-200 bg-white p-3">
        <p className="text-xs font-semibold text-zinc-800">添付ファイル</p>

        <div className="rounded-md border border-zinc-200 bg-zinc-50/80 px-2.5 py-2">
          <p className="text-[11px] font-medium text-zinc-800">
            このようなファイルがあれば添付してください。（例）
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[10px] leading-5 text-zinc-600">
            <li>
              <span className="font-medium text-zinc-700">指導案・単元計画</span>
              …計画書の PDF、配布資料
            </li>
            <li>
              <span className="font-medium text-zinc-700">教材・スライド</span>
              …板書代わりの PowerPoint
            </li>
            <li>
              <span className="font-medium text-zinc-700">ワークシート・板書・学習の様子</span>
              …プリントのスキャン、児童生徒の作品の写真
            </li>
            <li>
              <span className="font-medium text-zinc-700">授業の動き</span>
              …実験・朗読・グループ学習の短いクリップ
            </li>
          </ul>
        </div>

        <div className="space-y-1 text-[10px] text-zinc-600">
          <p>
            <span className="font-medium text-zinc-800">対応拡張子</span>
            <span className="text-zinc-500">（種類はファイルから自動判定）</span>
          </p>
          <ul className="space-y-0.5 border-l-2 border-zinc-200 pl-2.5">
            <li>
              <span className="text-zinc-700">PDF：</span>
              <span className="font-mono text-zinc-600">.pdf</span>
            </li>
            <li>
              <span className="text-zinc-700">スライド（PowerPoint）：</span>
              <span className="font-mono text-zinc-600">.ppt、.pptx</span>
            </li>
            <li>
              <span className="text-zinc-700">画像：</span>
              <span className="font-mono text-zinc-600">
                .gif、.jpeg、.jpg、.png、.webp
              </span>
            </li>
            <li>
              <span className="text-zinc-700">動画：</span>
              <span className="font-mono text-zinc-600">
                .m4v、.mov、.mp4、.qt、.webm、.wmv
              </span>
            </li>
          </ul>
          <p className="pt-0.5 text-zinc-500">
            PDF・スライド・画像は 25 MB まで、動画は 200 MB までです。混在して複数選択できます。
          </p>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-sky-700 bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white">
            ⬆ ファイルを選択
          </span>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3">
        <Field
          label="タイトル"
          required
          value="連立方程式：買い物の場面で式を立てる"
        />
        <div className="grid grid-cols-2 gap-2">
          <Field label="学年" required value="2年" select />
          <Field label="教科" required value="数学" select />
        </div>
        <div>
          <p className="text-[11px] font-medium text-zinc-700">
            単元<span className="ml-0.5 text-red-600">*</span>
          </p>
          <div className="mt-1 flex gap-3 text-[10px] text-zinc-600">
            <span className="font-medium text-sky-700">候補から選ぶ</span>
            <span>自由入力</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 rounded border border-zinc-300 bg-white px-2 py-1.5 text-[11px] text-zinc-800">
            <span className="truncate">連立方程式</span>
            <span className="text-zinc-400">▾</span>
          </div>
        </div>
        <Field label="内容項目（任意）" value="連立方程式の意味" />
        <FieldArea
          label="めあて"
          value="連立方程式を使って、買い物の問題を自分で解けるようになる。"
        />
        <FieldArea
          label="振り返り"
          value="式を立てるところで迷った。次は条件を表に整理してから取り組みたい。"
        />
        <Field label="ハッシュタグ" value="協同学習 振り返り" />
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  value,
  select,
}: {
  label: string;
  required?: boolean;
  value: string;
  select?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-700">
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : null}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2 rounded border border-zinc-300 bg-white px-2 py-1.5 text-[11px] text-zinc-800">
        <span className="truncate">{value}</span>
        {select ? <span className="text-zinc-400">▾</span> : null}
      </div>
    </div>
  );
}

function FieldArea({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-700">{label}</p>
      <div className="mt-1 min-h-12 rounded border border-zinc-300 bg-white px-2 py-1.5 text-[11px] leading-5 text-zinc-700">
        {value}
      </div>
    </div>
  );
}

function PolicyCheckMock() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-950">
        <p className="font-semibold">投稿前の確認（児童生徒の保護）</p>
        <ul className="mt-1.5 list-inside list-disc space-y-0.5">
          <li>顔が判別できる写真・動画は載せない（必要な場合はマスキング）</li>
          <li>氏名・個人が特定される情報は載せない</li>
          <li>保護者同意のない肖像・個人情報は載せない</li>
          <li>学校・地域のルールや指導要領に反しない内容にする</li>
        </ul>
        <p className="mt-2 text-[10px] text-amber-900/80">
          最終判断は校則・運用規程に従ってください。
        </p>
      </div>
      <label className="flex items-start gap-2 text-[11px] text-zinc-700">
        <span className="mt-0.5 inline-block h-3 w-3 rounded-sm border border-zinc-400 bg-white" />
        <span>
          上記ポリシーと学校の運用に従い、適切な内容のみを投稿します
        </span>
      </label>
      <span className="inline-block rounded bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white">
        保存する
      </span>
    </div>
  );
}

function CommentFormMock() {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-xs font-semibold text-zinc-800">コメント (2)</p>

      <div className="space-y-2">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2.5">
          <p className="text-[10px] text-zinc-500">2026/05/12 09:14</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-700">
            買い物の場面、生徒が乗ってきそうですね。導入のスライドを参考にさせてください。
          </p>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2.5">
          <p className="text-[10px] text-zinc-500">2026/05/12 11:02</p>
          <p className="mt-1 text-[11px] leading-5 text-zinc-700">
            条件を表にまとめる振り返り、来週のクラスでも試してみます。
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="min-h-16 rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-[11px] text-zinc-400">
          コメントを入力…
        </div>
        <span className="inline-block rounded bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white">
          コメントする
        </span>
      </div>
    </div>
  );
}

function NotificationBellMock() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-700">
          <span className="font-semibold tracking-tight text-zinc-900">
            jugyoBase
          </span>
          <div className="flex items-center gap-3">
            <span>事例一覧</span>
            <span>新規投稿</span>
            <span>マイページ</span>
            <span>教科別一覧</span>
            <span className="relative inline-flex">
              <span aria-hidden>🔔</span>
              <span className="absolute -right-2 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                3
              </span>
            </span>
            <span className="text-zinc-400">ログアウト</span>
          </div>
        </div>
      </div>

      <ul className="space-y-1.5">
        <li className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-[11px] text-zinc-800">
          <p>
            <span className="font-medium">山田 太郎</span>
            がコメントしました — <span className="text-sky-700">連立方程式：買い物の場面で…</span>
            <span className="ml-2 inline-block rounded-full bg-sky-500 px-1 py-0.5 text-[9px] font-medium text-white">
              新着
            </span>
          </p>
        </li>
        <li className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-[11px] text-zinc-800">
          <p>
            <span className="font-medium">佐藤 花子</span>
            がいいねしました — <span className="text-sky-700">走れメロスを「友情」…</span>
          </p>
        </li>
        <li className="rounded-lg border border-zinc-200 bg-white p-2.5 text-[11px] text-zinc-600">
          <p>
            <span className="font-medium">鈴木 一郎</span>
            がコメントしました — <span className="text-sky-700">水溶液の性質：色の変化…</span>
          </p>
        </li>
      </ul>
    </div>
  );
}

function MyPageMock() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">マイページ</p>
          <p className="text-[11px] text-zinc-500">
            自分が投稿した授業実践を管理できます
          </p>
          <span className="mt-2 inline-flex items-center rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-800 shadow-sm">
            プロフィールを編集
          </span>
        </div>
        <span className="rounded bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white">
          新規投稿
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-zinc-600">
          下書き（1件）
        </p>
        <div className="flex items-stretch gap-2 rounded-lg border border-amber-200 bg-amber-50">
          <div className="min-w-0 flex-1 p-3">
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      下書き
                    </span>
                    <span className="text-xs font-medium text-zinc-900">
                      水溶液の性質：色の変化を予想する
                    </span>
                  </span>
                  <span className="text-[10px] text-zinc-400">2026/05/11</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <PostMetaBadges
                    category="授業"
                    grade="小6"
                    subject="理科"
                    unit="水溶液の性質"
                    hasCurriculumUnitOptions
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center border-l border-amber-200 px-2">
            <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-800">
              削除
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-zinc-600">
          公開済み（2件）
        </p>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="flex gap-3">
            <div className="h-14 w-14 shrink-0 rounded border border-zinc-200 bg-gradient-to-br from-zinc-100 to-zinc-200" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-zinc-900">
                  連立方程式：買い物の場面で式を立てる
                </span>
                <span className="text-[10px] text-zinc-400">2026/05/10</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <PostMetaBadges
                  category="授業"
                  grade="2年"
                  subject="数学"
                  unit="連立方程式"
                  hasCurriculumUnitOptions
                />
              </div>
              <p className="mt-1 text-[10px] text-sky-700">#協同学習 #ICT</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-zinc-600">
          ブックマーク（1件）
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-500">★</span>
                  <span className="text-xs font-medium text-zinc-900">
                    走れメロスを「友情」の視点で読み直す
                  </span>
                </span>
                <span className="text-[10px] text-zinc-400">2026/05/08</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <PostMetaBadges
                  category="授業"
                  grade="2年"
                  subject="国語"
                  unit="走れメロス"
                  hasCurriculumUnitOptions
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryMock() {
  const chartRows = [
    { label: "業務改善", count: 5, width: 83 },
    { label: "AI・ICT活用", count: 3, width: 50 },
    { label: "数学", count: 6, width: 100 },
    { label: "国語", count: 4, width: 67 },
    { label: "共通", count: 2, width: 33 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900">教科別の共有マップ</p>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          いま校内でどの教科に知見が集まっているかが一目でわかります。
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "累計投稿数", value: "24件" },
          { label: "今月の投稿", value: "8件" },
          { label: "共有のある教科", value: "10教科" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-zinc-200 bg-white p-2 shadow-sm"
          >
            <p className="text-[9px] text-zinc-500">{card.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-zinc-800">みんなの共有</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-2.5">
            <div className="flex items-start justify-between gap-1">
              <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800">
                数学
              </span>
              <span className="text-xs font-semibold text-zinc-900">6件</span>
            </div>
            <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="absolute left-0 top-0 h-full w-4/5 rounded-full bg-sky-500" />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-2.5">
            <div className="flex items-start justify-between gap-1">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-900">
                業務改善
              </span>
              <span className="text-xs font-semibold text-zinc-900">5件</span>
            </div>
            <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="absolute left-0 top-0 h-full w-3/4 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-3">
        <p className="text-[11px] font-semibold text-zinc-800">教科別投稿数</p>
        <ul className="mt-2 space-y-1.5">
          {chartRows.map((row) => (
            <li key={row.label} className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate text-right text-[10px] text-zinc-600">
                {row.label}
              </span>
              <div className="relative h-3 flex-1 overflow-hidden rounded bg-zinc-100">
                <div
                  className="absolute left-0 top-0 h-full rounded bg-sky-500"
                  style={{ width: `${row.width}%` }}
                />
              </div>
              <span className="w-4 shrink-0 text-right text-[10px] font-medium text-zinc-700">
                {row.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
