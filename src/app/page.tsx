import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold text-carrot-dark">🥕 부핏Meals</span>
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link href="/login" className="text-ink-soft hover:text-ink">
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-carrot px-4 py-2 text-white hover:bg-carrot-dark"
          >
            회원가입
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="rounded-full bg-cream-soft px-4 py-1.5 text-sm font-medium text-carrot-dark">
          운동만큼 중요한 식단 관리
        </span>
        <h1 className="mt-6 text-balance text-3xl font-extrabold leading-tight sm:text-5xl">
          뚜렷한 목표를 세우고,
          <br />
          매일 <span className="text-carrot">당근</span>을 쌓아보세요
        </h1>
        <p className="mt-5 max-w-xl text-balance text-ink-soft">
          체성분 목표를 정하고, 매일 식단을 기록하면 당근이 쌓입니다. 담당
          영양코치의 피드백을 받고, 동료들과 함께 목표를 향해 나아가세요.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-carrot px-6 py-3 font-semibold text-white hover:bg-carrot-dark"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-line px-6 py-3 font-semibold text-ink hover:border-carrot"
          >
            로그인
          </Link>
        </div>
      </section>
    </main>
  );
}
