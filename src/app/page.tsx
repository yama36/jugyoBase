import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          jugyoBase
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          学校ごとのクローズドな空間で、授業実践を共有するための最小プラットフォームです。
          テナント URL の <span className="font-mono">/t/学校スラッグ/login</span>{" "}
          から Google でログインします。
        </p>
      </div>
      <p className="text-sm text-zinc-600">
        初回は運用者がテナントとユーザーを手動登録します。手順はリポジトリの{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">
          docs/TENANT_BOOTSTRAP.md
        </code>{" "}
        を参照してください。
      </p>
      <p className="text-xs text-zinc-500">
        例:{" "}
        <Link
          href="/t/demo/login"
          className="font-mono text-sky-800 underline-offset-2 hover:underline"
        >
          /t/demo/login
        </Link>{" "}
        （<code className="font-mono">npm run tenant:create -- --slug demo ...</code>{" "}
        で自分の Google メールを登録したあと）
      </p>
    </div>
  );
}
