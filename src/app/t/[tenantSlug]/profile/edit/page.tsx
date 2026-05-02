import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyProfile, updateProfile, SUBJECT_OPTIONS, GRADE_OPTIONS } from "@/app/actions/profile";

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();

  if (!session?.user?.id || session.user.tenantSlug !== tenantSlug) {
    redirect(`/t/${tenantSlug}/login`);
  }

  const profile = await getMyProfile();
  if (!profile) redirect(`/t/${tenantSlug}/login`);

  const currentSubjects = (profile as any).subjects as string[] ?? [];
  const currentGrades = (profile as any).grades as string[] ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">プロフィール編集</h1>
        <p className="mt-1 text-sm text-zinc-600">
          投稿者名や担当教科など、自分の情報を設定できます
        </p>
      </div>

      <form action={updateProfile} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            表示名
          </label>
          <p className="mt-0.5 text-xs text-zinc-500">
            投稿者名として表示されます（未設定の場合はメールアドレス）
          </p>
          <input
            name="name"
            type="text"
            defaultValue={profile.name ?? ""}
            placeholder="山田 太郎"
            className="mt-1.5 w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            役職・肩書き
          </label>
          <input
            name="position"
            type="text"
            defaultValue={(profile as any).position ?? ""}
            placeholder="例: 3年主任、理科主任"
            className="mt-1.5 w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-zinc-700">担当教科</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 text-sm has-[:checked]:border-sky-300 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-800"
              >
                <input
                  type="checkbox"
                  name="subjects"
                  value={s}
                  defaultChecked={currentSubjects.includes(s)}
                  className="sr-only"
                />
                {s}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-zinc-700">担当学年</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {GRADE_OPTIONS.map((g) => (
              <label
                key={g}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 text-sm has-[:checked]:border-sky-300 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-800"
              >
                <input
                  type="checkbox"
                  name="grades"
                  value={g}
                  defaultChecked={currentGrades.includes(g)}
                  className="sr-only"
                />
                {g}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            自己紹介
          </label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={(profile as any).bio ?? ""}
            placeholder="得意分野や授業のこだわりなど"
            className="mt-1.5 w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            保存する
          </button>
          <a
            href={`/t/${tenantSlug}/mypage`}
            className="text-sm text-zinc-500 underline-offset-2 hover:underline"
          >
            キャンセル
          </a>
        </div>
      </form>
    </div>
  );
}
