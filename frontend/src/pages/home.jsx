import Navbar from "../components/navbar";
import Hero from "../components/hero";

export default function Home({ navigate, currentUser }) {
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div>
      <Navbar navigate={navigate} currentUser={currentUser} />
      <Hero />
      {isAdmin ? (
        <section className="bg-slate-950 px-4 py-10 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">Sadun Module</p>
              <h2 className="mt-3 text-3xl font-black">Open the doctor-service frontend</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Manage verified doctors, specialization details, schedules, departments, and consultation fees using the live `doctor-service` backend.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor-service')}
              className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open doctor-service UI
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}


   
