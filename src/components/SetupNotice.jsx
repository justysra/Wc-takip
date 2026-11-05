export default function SetupNotice({ error }) {
  return (
    <div className="grid min-h-svh place-items-center bg-zinc-50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 text-[13.5px] text-slate-600 shadow-sm">
        <h1 className="mb-3 text-[17px] font-semibold tracking-tight text-slate-900">Supabase bağlantısı kurulamadı</h1>
        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-100 p-3 font-mono text-[12px] text-rose-800">
            {error.message}
          </p>
        )}
        <ol className="list-decimal space-y-1.5 pl-5 marker:text-slate-400">
          <li>
            Yerelde <code className="text-slate-800">.env</code>, GitHub Pages derlemesinde ise{' '}
            <code className="text-slate-800">VITE_SUPABASE_URL</code> ve{' '}
            <code className="text-slate-800">VITE_SUPABASE_ANON_KEY</code> secret’ları tanımlı olmalı. Adres{' '}
            <code className="text-slate-800">https://&lt;proje&gt;.supabase.co</code> biçiminde kalmalı.
          </li>
          <li>
            Supabase SQL Editor'da <code className="text-slate-800">supabase/schema.sql</code> dosyasını çalıştırın.
          </li>
          <li>
            Authentication ayarlarında <span className="text-slate-800">Anonymous sign-ins</span> seçeneğini açın.
          </li>
          <li>Geliştirme sunucusunu yeniden başlatın.</li>
        </ol>
      </div>
    </div>
  )
}
