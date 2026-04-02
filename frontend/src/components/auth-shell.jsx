const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
  navigate,
}) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef6ff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white"
        >
          <span aria-hidden="true">←</span>
          Back to home
        </button>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Secure Patient Access
            </span>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">{subtitle}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <div className="text-2xl font-black text-teal-700">5 min</div>
                <p className="mt-2 text-sm text-slate-500">OTP expiry window for safer sign-in</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <div className="text-2xl font-black text-cyan-700">24/7</div>
                <p className="mt-2 text-sm text-slate-500">Access your care account anytime</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
                <div className="text-2xl font-black text-slate-900">OTP</div>
                <p className="mt-2 text-sm text-slate-500">Email verification before account access</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:p-8">
            {children}
            {footer ? <div className="mt-6 border-t border-slate-100 pt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
