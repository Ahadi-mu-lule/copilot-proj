import Link from 'next/link';

export default function RequestDemoPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-slate-900">Request a FlexSACCO demo</h1>
        <p className="mt-2 text-slate-600">Tell us about your SACCO, the challenges you're facing, and the type of support you need.</p>

        <form className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Organization name</label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" placeholder="Kampala SACCO" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Contact name</label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" placeholder="Jane Nakato" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500" type="email" placeholder="jane@your-sacco.org" />
          </div>
          <button type="button" className="w-full rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white">
            Send request
          </button>
        </form>
      </div>
    </main>
  );
}
