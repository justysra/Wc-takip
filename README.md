# 24 Saat · 72 Tuvalet Bloğu

00:00–24:00 arasını 20 dakikalık 72 kalıcı slota bölen, imece usulü doldurulan gerçek zamanlı tablo.
React (Vite) + Tailwind CSS v4 + Supabase (Postgres, Realtime, Anonymous Auth).

## Kurulum

1. Supabase'de bir proje açın.
2. **SQL Editor** içinde `supabase/schema.sql` dosyasının tamamını çalıştırın (tablo, RLS politikaları ve Realtime yayını).
3. **Authentication → Sign In / Providers** altında **Allow anonymous sign-ins** seçeneğini açın.
4. `.env.example` dosyasını `.env` olarak kopyalayıp **Project Settings → API** sayfasındaki URL ve anon/publishable anahtarını girin.
5. `npm install` ve `npm run dev`.

## Kurallar nasıl uygulanıyor?

- Her tarayıcı ilk açılışta anonim bir Supabase kullanıcısı olur; kullanıcı adı `localStorage`'da tutulur.
- Slot alma `insert` ile yapılır; `slot_index` birincil anahtar olduğu için aynı slotu iki kişi aynı anda alamaz.
- Silme yetkisi veritabanında RLS ile kısıtlıdır (`owner_id = auth.uid()`), yani yalnızca slotu alan kişi bırakabilir.
- Tablo hiçbir zaman otomatik sıfırlanmaz.
