# FLOWSTATE RACING: indulási útmutató

Állapot: 2026. szeptember 19. Implementált és helyben tesztelt indulási alap, nem hitelesített, éles webshop. Az üzleti adatok, szolgáltatói fiókok, gyártói tények és éles próbák még hiányoznak. Ezeket nem helyettesíti egy konfigurációs kapcsoló. A kód GitHubon marad; a kereskedelmi tárhely Cloudflare Worker + statikus fájlok + D1 lesz.

## 1. Amit most elintézhetsz

1. Regisztrálj saját Cloudflare-, Stripe- és Brevo-fiókot. Kapcsolj be kétlépcsős azonosítást. A szolgáltatók üzleti ellenőrzése külön folyamat; a tesztfiók nem élő kereskedői jóváhagyás.
2. Válassz saját domaint. A végső QR-kódot csak ezután érdemes nagy mennyiségben nyomtatni.
3. Könyvelővel tisztázd a vállalkozási formát és a munkaviszony melletti adózást. Nem feltétlenül kell gazdasági társaság: egyéni vállalkozás is szóba jöhet. Ellenőrizd a kereskedelmi bejelentést, tevékenységi kört, áfát, EU-s értékesítést/OSS-t, számlázást, csomagolási/EPR-kötelezettségeket. Ezek nincsenek automatikusan megoldva attól, hogy Stripe-ot használsz.
4. Kérj valódi ruhamintát, összetételt, mért mérettáblát, kezelési címkét, gyártó-/felelős gazdasági szereplői adatot és vállalható gyártási határidőt. A reflective kép látványterv, nem bizonyíték a termék teljesítményére. Nézd át a GPSR, textilcímkézés és célországi tájékoztatási követelményeket.

## 2. Mit kell kitöltened?

`config/business.ts` tartalmazza a nyilvános üzleti adatokat. Nem titoktároló. Ne írj bele API-kulcsot vagy olyan magánadatot, amelyet nem akarsz üzleti adatként közzétenni.

| Adat | Honnan jön? |
| --- | --- |
| Hivatalos név, forma, székhely, nyilvántartás, adószám | Bejegyzett vállalkozás |
| Ügyfélszolgálat, telefon, panasz- és visszaküldési cím | Valóban működő elérhetőségek |
| Békéltető testület, elérhetősége | Székhelyhez és hatályos szabályokhoz igazítva |
| Áfa- és számlázási tájékoztatás | Könyvelő + választott számlázó |
| Országonkénti szállítási mód és bruttó HUF-díj | Fuvarozói szerződés; a Magyar Posta opció alkalmazhatóságát is ellenőrizd |
| Nyitás/zárás és legkésőbbi kézbesítés | Visszaigazolt gyártói vállalás |
| Gyártó és termékadatok EN/HU/DE | Jóváhagyott termékminta és dokumentáció |
| Adatfeldolgozók, adattovábbítások, megőrzés | Tényleges Cloudflare/Stripe/Brevo/fuvarozó/számlázó szerződések |

A jogi oldalak közvetlenül ebből a konfigurációból és a `lib/policies.ts` szövegeiből épülnek. EN/HU/DE változatok vannak. A tervezeteket az adott vállalkozáshoz és célországokhoz hozzáértővel ellenőriztesd. Külön ellenőrzendő a magyar panaszkezelési határidő, szavatossági tájékoztatás, szerződéskötés/visszaigazolás, valamint az online elállási funkció aktuális követelménye. Ne állítsd igazra a `policyReviewed` értéket egy ellenőrizetlen sablon miatt.

Ellenőrzés:

```sh
node --experimental-strip-types scripts/check-launch.ts
```

Ez felsorolja a hiányzó adatokat és ellenőrzéseket. Nem jogi tanúsítás. A `false` értékű jóváhagyási jelzőket csak a feladat tényleges elvégzése után állítsd át. Ne tedd élessé a pénztárat pusztán azért, hogy eltűnjenek a hibák.

## 3. Miért Stripe, ha van PayPalod?

A megvalósított integráció Stripe Checkout. A kártyaadatok a Stripe fizetési oldalán maradnak; a saját szerver csak ellenőrzött rendelési adatokat küld. Magyarországi vállalkozások számára elérhető. A konkrét fizetési módok, díjak és jogosultságok a fióktól és az aktuális feltételektől függenek. Jelenleg kártyás checkout van beállítva.

PayPal később hozzáadható. Elsődlegesen értékesítéshez a PayPal szabályai Business-fiókot írnak elő. A személyes fiók vagy Friends & Family utalás nem helyettesíti a webshopos rendeléskezelést, számlázást és fogyasztói jogokat. PayPal API nincs ebben a kiadásban.

## 4. Cloudflare tárhely és adatbázis

A GitHub Pages nem az éles bolt tárhelye: a szolgáltatás feltételei kizárják az e-kereskedelmi használatot. A jelenlegi oldal előnézet. A végleges domaint Cloudflare-re irányítsd; a Pages előnézeten ne nyiss értékesítést.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm exec wrangler login
pnpm exec wrangler d1 create flowstate-commerce
```

Az új adatbázis azonosítóját írd a `services/site/wrangler.jsonc` `database_id` mezőjébe. Ez egy új, külön commerce-adatbázis. A régi prototípus migrációit ne írd át, régi rekordokat ne másolj át ellenőrzés nélkül.

```sh
pnpm exec wrangler d1 migrations apply flowstate-commerce --remote --config services/site/wrangler.jsonc
pnpm exec wrangler secret put STRIPE_SECRET_KEY --config services/site/wrangler.jsonc
pnpm exec wrangler secret put STRIPE_WEBHOOK_SECRET --config services/site/wrangler.jsonc
pnpm exec wrangler secret put BREVO_API_KEY --config services/site/wrangler.jsonc
pnpm exec wrangler secret put RATE_HASH_SECRET --config services/site/wrangler.jsonc
```

Először Stripe **tesztkulcsokat** használj. A hash-secret legyen legalább 32 véletlen bájt. A kulcsokat a terminál titkos bekérőjébe add meg, ne a chatbe és ne GitHub-fájlba. A `MAIL_FROM` mezőbe hitelesített feladót írj. Brevónál állítsd be a domain hitelesítését (SPF/DKIM és megfelelő DMARC), a hírlevél-listákat és a három double-opt-in sablont. Részletek: EMAIL-SETUP.md.

Helyi build és telepítés, minden funkció alapértelmezetten kikapcsolva:

```sh
STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH= pnpm exec next build
node scripts/build-csp.mjs
pnpm exec wrangler deploy --config services/site/wrangler.jsonc
```

A CSP-generálás kötelező minden build után. A Worker a tényleges statikus HTML inline scriptjeinek hashét engedi, nem általános `unsafe-inline` JavaScriptet. Cloudflare-ben rendeld a saját domaint a Workerhez. A `business.siteUrl` a végleges HTTPS gyökér-URL legyen, záró perjellel.

GitHubos telepítéshez a `production` environmentbe add a `CLOUDFLARE_API_TOKEN` és `CLOUDFLARE_ACCOUNT_ID` secretet. Csak a szükséges Worker-deploy jogosultságokat add; a fizetési és Brevo-kulcsok Cloudflare-secretek maradnak. A Production workflow kézzel indítható. A D1 migrációkat ellenőrzötten alkalmazd a telepítés előtt. Beállítható environment-jóváhagyás és branch-védelem.

## 5. Fizetési események

Stripe webhook cím: `https://SAJAT-DOMAIN/api/stripe/webhook`.

Események: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`. Az API-verzió a kódban `2024-06-20`, a webhook endpointot is ehhez állítsd. A fiókban add meg az ÁSZF- és adatvédelmi URL-eket. A checkout kéri a feltételek elfogadását. A kód `HUF` bruttó katalógusárakat használ; a banki átváltást nem mi végezzük. Adó- vagy vámkalkulátor nincs automatikusan aktiválva.

Teszteld: siker, elutasított kártya, 3DS, megszakítás, ugyanazon kérés újraküldése, hibás webhook-aláírás, eseményismétlés, rossz összeg, visszatérítés, chargeback és szolgáltatói kiesés. Sikeroldalból soha nem indul teljesítés. A Stripe Dashboard és a D1 rekordok alapján egyeztesd a tranzakciókat.

A pénztár legfeljebb 5 darabot enged méretenként, összesen 10-et. Új fizetési munkamenet a drop utolsó 30 percében nem indítható, hogy a Stripe minimális lejárati ideje ne lógjon túl a záráson. A már kiadott checkout legkésőbb záráskor lejár. Ezt a tervezett drop-időzítésnél vedd figyelembe.

## 6. E-mail, elállás, számlázás, csomagfeladás

Hitelesített fizetéskor a backend tartós feladatokat rögzít: szerződéses visszaigazolás, számlázás, teljesítés. A percenként futó mail worker a visszaigazolásba beleteszi a rendeléskor eltárolt teljes ÁSZF- és elállási szöveget, tételeket és összegeket. A rendelési adat nem kerül a visszatérési URL-be. Sikertelen levélküldést újrapróbál; tartós hiba felülvizsgálatot igényel. A szolgáltató által elfogadott levél nem garantált postaládakézbesítés. Figyeld a Brevo bounce- és kézbesítési naplóját. Kiesés utáni újraküldésnél ritka duplikált e-mail lehetséges, a fizetés és teljesítési feladat ettől nem duplázódik.

Az elállási űrlap előbb áttekintést, majd külön megerősítést kér. Rögzíti a nyilatkozatot és átvételi e-mailt küld. Nem követeli meg a bejelentkezést, és nem szűnik meg a drop zárásakor. Nem hajt végre automatikus visszatérítést: az ügyet és a jogszabályi feltételeket az eladó intézi. E-mailes elállást is fogadj el.

**Számlázás és logisztika:** ebben a kiadásban operátori feladat. Válassz magyar számlázót, például a könyvelőd által támogatott rendszert, és ellenőrizd a NAV-adatszolgáltatást. A Stripe nyugta nem helyettesíti automatikusan a magyar szabályok szerinti számlát. A `tax_invoice` feladatot csak a tényleges bizonylat kiállítása után zárd le; a `fulfillment` feladatot a tényleges csomagfeladás után. A fuvarozói címke, rendelésenkénti számlaautomatizálás és visszáru-logisztika nem lett külső szolgáltatóhoz bekötve.

Az operátori felületek a védett Stripe/Brevo/Cloudflare szolgáltatói felületek. Nincs jelszó nélküli, saját `/admin` végpont. Napi teendők: pending/review feladatok, egyeztetés, visszáru, számlázás, csomagfeladás, kézbesítési hibák. Fizetés fogadását csak akkor nyisd meg, ha ezt ténylegesen el tudod látni.

## 7. Sütik és adatvédelem

Nincs Meta Pixel, TikTok Pixel, Google Analytics vagy social embed. A kosár és a kifejezetten választott nyelv helyben tárolódik, 30 napos lejárattal, törölhetően. Üres kosarat nem mentünk. Önmagában ezért nem telepítünk külső sütiszolgáltatót és nem kérünk nem létező marketinghozzájárulást.

Ha mérőkódot szeretnél, előbb külön kategóriás hozzájárulás, alapértelmezett blokkolás, ugyanolyan könnyű elutasítás és visszavonás, naplózás és végső domainen hálózati ellenőrzés szükséges. Egy banner elhelyezése nem blokkolja magától a scriptet. Az email-marketing és a sütik hozzájárulása külön dolog.

Az adatkezelési tervezetben töltsd ki a pontos adatfeldolgozókat, tárolási helyeket/adattovábbításokat, megőrzést, jogos érdek mérlegelését és a kérelmek kezelését. Készíts törlési, mentési-visszaállítási és incidenskezelési eljárást; a jogszerűen megőrzendő számviteli adatokat ne töröld egy általános „adatok törlése” kérésre automatikusan. A régi prototípus esetleges adatait külön vizsgáld meg.

## 8. Élesítési sorrend

1. Tényleges termékadatok, vállalkozás, számlázás, szállítás és ellenőrzött szabályzatok.
2. Saját domain + Cloudflare D1 és titkok + Stripe tesztwebhook + Brevo hitelesítés.
3. Tesztrendelés, visszaigazolás teljes feltételekkel, számla, visszatérítés, elállási nyilatkozat és átvételi email, leiratkozás, törlés, biztonsági mentés/visszaállítás próbája.
4. `check-launch.ts` és az automatikus tesztek. Ellenőrizd a végső domain CSP-jét és hálózati kéréseit telefonon is.
5. Stripe élő fiók jóváhagyás, élő kulcs és élő webhook-secret, `STRIPE_MODE=live`.
6. A Workerben `CHECKOUT_ENABLED`, `WITHDRAWAL_ENABLED`, `TRANSACTIONAL_MAIL_ENABLED` csak a sikeres próbák után legyen `true`. A hírlevél `REGISTRATION_ENABLED` ettől független.
7. A GitHub production environment változói: `CHECKOUT_ENABLED`, `WITHDRAWAL_ENABLED`, szükség esetén `WAITLIST_ENABLED`. Új production build. Ne a Pages environmentben állítsd be ezeket.
8. Korlátozott indulás és tényleges, engedélyezett kis összegű fizetés/visszatérítés ellenőrzése. Amíg ez nincs meg, ne állítsd, hogy a rendszer production ready.

## Elsődleges források

- GitHub Pages korlátok: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Stripe Checkout: https://docs.stripe.com/payments/checkout
- Stripe országok: https://stripe.com/global
- Stripe aláírás-ellenőrzés: https://docs.stripe.com/webhooks/signature
- PayPal magyar fiókra vonatkozó megállapodás: https://www.paypal.com/hu/legalhub/paypal/useragreement-full
- EU távértékesítés: https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm
- EU online adatvédelem/sütik: https://europa.eu/youreurope/business/growing/digitalising/online-privacy/index_en.htm
- GPSR: https://eur-lex.europa.eu/eli/reg/2023/988/oj/eng
- Online elállás EU szabályozási háttér: https://eur-lex.europa.eu/eli/dir/2023/2673/oj/eng (a hatályos magyar átültetés külön ellenőrzendő)
- NAV egyéni vállalkozás: https://nav.gov.hu/print/Elethelyzetek-adozasa/vallalkozas/Egyeni-vallalkozas-inditasa
- Magyar Posta webáruházi tájékoztató: https://www.posta.hu/webaruhazi_regisztracio
- Brevo transactional API: https://developers.brevo.com/reference/send-transac-email

## Ellenőrzési jegyzet
A Next.js statikus build és 10 automatikus teszt sikeres. A tesztek helyi SQLite-on és mockolt Stripe/Brevo válaszokkal futottak. A production függőségek auditja a javítások után 0 ismert találatot jelzett; ez nem teljes biztonsági audit. A Cloudflare Wrangler szárazpróbát az automatikus jóváhagyás-ellenőrzés blokkolta a lehetséges külső forráskód/metaadat-továbbítás miatt. Cloudflare-futtatás, élő fizetés és valódi emailkézbesítés ebben a munkamenetben nem lett igazolva.
