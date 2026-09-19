"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ChevronLeft, ChevronRight, Menu, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { sanitizeCart, type CartItem } from "@/lib/cart";
import { sitePath } from "@/lib/paths";
import { ui } from "@/lib/translations";
import { useLanguage, LanguageSwitcher } from "@/components/language";
import { catalog } from "@/services/commerce/catalog";
import { business } from "@/config/business";
import { Checkout } from "@/components/checkout";
import { launch } from "@/lib/store-config";
import { SignupForm } from "@/components/signup-form";


type Product = {
  id: number;
  code: string;
  name: string;
  detail: string;
  huf: number;
  eur: number;
  sizes?: string[];
  image?: string;
  visual: "tee" | "hoodie" | "sticker" | "tag";
};

const products: Product[] = [
  { id: 1, code: "FSR-001", name: "STATE 01 HEAVY TEE", detail: "OVERSIZED · DESIGN CONCEPT", huf: catalog[1].huf, eur: 43, sizes: ["S", "M", "L", "XL", "XXL"], image: "/flowstate-tee-v2.webp", visual: "tee" },
  { id: 2, code: "FSR-002", name: "47°N DIVISION HOODIE", detail: "BOXY FIT · CYBERSIGIL BACK PRINT CONCEPT", huf: catalog[2].huf, eur: 84, sizes: ["S", "M", "L", "XL", "XXL"], image: "/flowstate-hoodie.webp", visual: "hoodie" },
  { id: 4, code: "FSR-004", name: "EUROPEAN DIVISION JET TAG", detail: "JET TAG KEYCHAIN · DESIGN CONCEPT", huf: catalog[4].huf, eur: 12, image: "/flowstate-accessories.webp", visual: "tag" },
];

const copy = {
  EN: {
    nav: ["DROP 001", "MANIFESTO", "THE SYSTEM"],
    heroEyebrow: "47°N / EUROPEAN DIVISION",
    heroSub: "Clothing for the moment everything unnecessary disappears and only focus remains.",
    enter: "ENTER DROP 001",
    manifesto: "READ THE MANIFESTO",
    dropIntro: "One hoodie. One tee. One jet tag. First-drop concepts; prices and specifications stay provisional until samples are approved.",
    add: "ADD TO BAG",
    first: "FIRST RELEASE",
    conceptLabel: "PROVISIONAL PRICE / CONCEPT",
    lookLabel: "FIT REFERENCE",
    lookTitle: "BUILT TO MOVE.",
    lookText: "Oversized streetwear concepts. Verified measurements, model photography and video follow production samples. These garments are not protective motorcycle equipment.",
    manifestoLabel: "FLOWSTATE / MANIFESTO 001",
    manifestoKicker: "PRESENCE OVER NOISE",
    manifestoHeadline: "WHEN THE WORLD NARROWS, YOU BECOME PRESENT.",
    manifestoIntro: "Flowstate is not a promise about speed. It is the state where distraction drops away and perception, timing and action line up. The brand is built around that feeling of complete presence.",
    manifestoQuote: "NO PAST. NO NEXT. ONLY NOW.",
    pillars: [
      ["01", "300 KM/H", "On a closed circuit, 300 km/h is our visual metaphor for total attention. The edges blur, the line matters, and every input has consequence. Not recklessness. Presence.", "CIRCUIT / FOCUS"],
      ["02", "47°N", "47°N marks our Central-European origin. FLOWSTATE RACING was born in Hungary, between old roads, late-night garages and a new generation building its own visual language.", "HUNGARY / CENTRAL EUROPE"],
      ["03", "FOREVER YOUNG", "Forever young is not about age. It is refusing to become numb. Stay curious. Keep creating. Collect moments strong enough to remember who you were when you felt fully alive.", "MINDSET / MEMORY"],
    ],
    systemLabel: "PRE-ORDER MODEL",
    system: "THE DROP SYSTEM",
    steps: [
      ["72-HOUR PRE-ORDER", "Early access opens to the division first. When the window closes, it closes."],
      ["MADE TO ORDER", "Every piece enters production after the drop. No dead stock and no fake restocks."],
      ["SHIPPED FROM HUNGARY", "Hungary and EU are the planned delivery areas. Dates and costs will be confirmed before checkout opens."],
    ],
    access: "DIVISION ACCESS",
    accessTitle: "ENTER BEFORE THE WINDOW OPENS.",
    accessText: "Get the private opening code, exact launch time and first access to DROP 001.",
    email: "EMAIL ADDRESS",
    consent: "I want DROP 001 launch emails from FLOWSTATE RACING and can unsubscribe anytime.",
    join: "JOIN THE DIVISION",
    joined: "ACCESS REQUESTED. YOU'RE ON THE LIST.",
    privacy: "Your email is used only for FLOWSTATE RACING drop communication. See Privacy for details.",
    cart: "YOUR PREVIEW BAG",
    empty: "Your pre-order is empty.",
    total: "TOTAL",
    checkout: "GET DROP ACCESS",
    noCharge: "Payment activates when pre-orders open. No charge today.",
    launchNotice: "Early-access registration opens shortly. No email is collected until the mail connection is active.",
    joinError: "Signup failed. Please try again.",
    stickerEyebrow: "47°N / STREET SIGNAL",
    stickerText: "QR sticker concept built to move from street to screen. The print proof stays separate so the final code can be tested before production.",
    languageLabel: "Choose language",
  },
  HU: {
    nav: ["DROP 001", "MANIFESZTÓ", "A RENDSZER"],
    heroEyebrow: "47°N / EURÓPAI DIVÍZIÓ",
    heroSub: "Ruházat arra a pillanatra, amikor minden felesleges eltűnik, és csak a fókusz marad.",
    enter: "DROP 001 MEGNYITÁSA",
    manifesto: "A MANIFESZTÓ",
    dropIntro: "Egy pulcsi. Egy póló. Egy jet tag kulcstartó. Első drop tervek; az árakat és részleteket a minták jóváhagyása után véglegesítjük.",
    add: "KOSÁRBA",
    first: "ELSŐ KIADÁS",
    conceptLabel: "TERVEZETT ÁR / LÁTVÁNYTERV",
    lookLabel: "FAZON REFERENCIA",
    lookTitle: "MOZGÁSRA TERVEZVE.",
    lookText: "Oversized streetwear látványtervek. A valódi mérettáblázatot, modellfotókat és videót a gyártási minták után adjuk hozzá. Ezek nem motoros védőruházati termékek.",
    manifestoLabel: "FLOWSTATE / MANIFESZTÓ 001",
    manifestoKicker: "JELENLÉT A ZAJ HELYETT",
    manifestoHeadline: "AMIKOR BESZŰKÜL A VILÁG, TELJESEN JELEN VAGY.",
    manifestoIntro: "A flowstate nálunk nem a sebességről szóló ígéret. Az az állapot, amikor eltűnik a zavaró zaj, és az érzékelés, az időzítés meg a mozdulat egy ritmusba kerül. Erre a teljes jelenlétre épül a márka.",
    manifestoQuote: "NINCS MÚLT. NINCS KÖVETKEZŐ. CSAK MOST.",
    pillars: [
      ["01", "300 KM/H", "Zárt pályán a 300 km/h nálunk a teljes figyelem vizuális szimbóluma. A szélek elmosódnak, az ív számít, minden mozdulatnak súlya van. Nem vakmerőség. Jelenlét.", "PÁLYA / FÓKUSZ"],
      ["02", "47°N", "A 47°N a közép-európai eredetünket jelöli. A FLOWSTATE RACING Magyarországon született, régi utak, késő esti garázsok és egy új generáció saját vizuális nyelve között.", "MAGYARORSZÁG / KÖZÉP-EURÓPA"],
      ["03", "FOREVER YOUNG", "A forever young nem életkor. Azt jelenti, hogy nem tompulsz bele mindenbe. Maradj kíváncsi, alkoss, és gyűjts olyan pillanatokat, amelyek emlékeztetnek arra, mikor érezted magad igazán élőnek.", "SZEMLÉLET / EMLÉK"],
    ],
    systemLabel: "ELŐRENDELÉSI MODELL",
    system: "A DROP RENDSZER",
    steps: [
      ["72 ÓRÁS ELŐRENDELÉS", "A divízió tagjai kapnak első hozzáférést. Ha bezár az időablak, vége a dropnak."],
      ["RENDELÉSRE GYÁRTVA", "Minden darab a drop lezárása után kerül gyártásba. Nincs felesleges készlet és kamu restock."],
      ["SZÁLLÍTÁS MAGYARORSZÁGRÓL", "Tervezett célterület: Magyarország és EU. A díjakat és határidőket rendelésnyitás előtt véglegesítjük."],
    ],
    access: "DIVÍZIÓ HOZZÁFÉRÉS",
    accessTitle: "LÉPJ BE, MIELŐTT MEGNYÍLIK.",
    accessText: "Megkapod a privát kódot, a pontos indulási időt és az első hozzáférést a DROP 001-hez.",
    email: "EMAIL CÍM",
    consent: "Kérem a FLOWSTATE RACING DROP 001 indulásáról szóló emaileket, és bármikor leiratkozhatok.",
    join: "CSATLAKOZOM",
    joined: "HOZZÁFÉRÉS KÉRVE. FELKERÜLTÉL A LISTÁRA.",
    privacy: "Az email címedet csak FLOWSTATE RACING drop kommunikációra használjuk. Részletek az Adatvédelem oldalon.",
    cart: "TERVEZETT KOSARAD",
    empty: "Az előrendelésed még üres.",
    total: "ÖSSZESEN",
    checkout: "KÉREK HOZZÁFÉRÉST",
    noCharge: "Fizetni csak az előrendelés megnyitásakor lehet. Most nincs terhelés.",
    launchNotice: "A korai hozzáférés hamarosan nyílik. Amíg az email kapcsolat nincs aktiválva, nem gyűjtünk email címet.",
    joinError: "Most nem sikerült a feliratkozás. Próbáld újra.",
    stickerEyebrow: "47°N / STREET SIGNAL",
    stickerText: "QR-matrica koncepció, amely az utcáról egyből a képernyőre visz. A nyomdai proof külön marad, hogy gyártás előtt ténylegesen tesztelhető legyen a kód.",
    languageLabel: "Nyelv választása",
  },
  DE: {
    nav: ["DROP 001", "MANIFEST", "DAS SYSTEM"],
    heroEyebrow: "47°N / EUROPÄISCHE DIVISION",
    heroSub: "Kleidung für den Moment, in dem alles Unwichtige verschwindet und nur noch Fokus bleibt.",
    enter: "DROP 001 ÖFFNEN",
    manifesto: "MANIFEST LESEN",
    dropIntro: "Ein Hoodie. Ein T-Shirt. Ein Jet-Tag-Schlüsselanhänger. Konzepte für den ersten Drop; Preise und Spezifikationen bleiben bis zur Freigabe der Muster vorläufig.",
    add: "IN DEN WARENKORB",
    first: "ERSTER RELEASE",
    conceptLabel: "VORLÄUFIGER PREIS / KONZEPT",
    lookLabel: "FIT-REFERENZ",
    lookTitle: "FÜR BEWEGUNG GEMACHT.",
    lookText: "Oversized-Streetwear-Konzepte. Verifizierte Maße, Modelfotos und Video folgen nach den Produktionsmustern. Diese Kleidungsstücke sind keine Motorrad-Schutzbekleidung.",
    manifestoLabel: "FLOWSTATE / MANIFEST 001",
    manifestoKicker: "PRÄSENZ STATT RAUSCHEN",
    manifestoHeadline: "WENN DIE WELT SCHMALER WIRD, BIST DU GANZ IM MOMENT.",
    manifestoIntro: "Flowstate ist für uns kein Versprechen über Geschwindigkeit. Es ist der Zustand, in dem Ablenkung verschwindet und Wahrnehmung, Timing und Handlung zusammenfallen. Auf diesem Gefühl vollständiger Präsenz baut die Marke auf.",
    manifestoQuote: "KEINE VERGANGENHEIT. KEIN DANACH. NUR JETZT.",
    pillars: [
      ["01", "300 KM/H", "Auf abgesperrter Strecke sind 300 km/h unser visuelles Bild für totale Aufmerksamkeit. Die Ränder verschwimmen, die Linie zählt und jeder Input hat Folgen. Nicht Leichtsinn. Präsenz.", "RENNSTRECKE / FOKUS"],
      ["02", "47°N", "47°N steht für unseren mitteleuropäischen Ursprung. FLOWSTATE RACING wurde in Ungarn geboren, zwischen alten Straßen, späten Garagenabenden und einer neuen Generation mit eigener Bildsprache.", "UNGARN / MITTELEUROPA"],
      ["03", "FOREVER YOUNG", "Forever young hat nichts mit Alter zu tun. Es heißt, nicht abzustumpfen. Bleib neugierig, erschaffe Dinge und sammle Momente, die dich daran erinnern, wann du dich wirklich lebendig gefühlt hast.", "HALTUNG / ERINNERUNG"],
    ],
    systemLabel: "VORBESTELL-MODELL",
    system: "DAS DROP-SYSTEM",
    steps: [
      ["72-STUNDEN-VORBESTELLUNG", "Die Division erhält zuerst Zugang. Wenn das Zeitfenster schließt, ist der Drop geschlossen."],
      ["MADE TO ORDER", "Jedes Teil geht erst nach dem Drop in Produktion. Kein totes Lager und keine künstlichen Restocks."],
      ["VERSAND AUS UNGARN", "Ungarn und die EU sind als Liefergebiete geplant. Termine und Kosten werden vor Öffnung des Checkouts bestätigt."],
    ],
    access: "DIVISION-ZUGANG",
    accessTitle: "KOMM REIN, BEVOR DAS FENSTER ÖFFNET.",
    accessText: "Erhalte den privaten Zugangscode, die genaue Startzeit und den ersten Zugriff auf DROP 001.",
    email: "E-MAIL-ADRESSE",
    consent: "Ich möchte E-Mails zum Start von DROP 001 von FLOWSTATE RACING erhalten und kann mich jederzeit abmelden.",
    join: "DER DIVISION BEITRETEN",
    joined: "ZUGANG ANGEFRAGT. DU STEHST AUF DER LISTE.",
    privacy: "Deine E-Mail wird nur für FLOWSTATE RACING Drop-Kommunikation verwendet. Details findest du unter Datenschutz.",
    cart: "DEIN PREVIEW-WARENKORB",
    empty: "Deine Vorbestellung ist noch leer.",
    total: "GESAMT",
    checkout: "DROP-ZUGANG HOLEN",
    noCharge: "Die Zahlung wird erst aktiv, wenn die Vorbestellung öffnet. Heute keine Belastung.",
    launchNotice: "Der Early-Access öffnet bald. Solange die Mail-Verbindung nicht aktiv ist, werden keine E-Mail-Adressen gesammelt.",
    joinError: "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
    stickerEyebrow: "47°N / STREET SIGNAL",
    stickerText: "QR-Sticker-Konzept als Brücke von der Straße zum Screen. Der Druck-Proof bleibt separat, damit der finale Code vor der Produktion getestet werden kann.",
    languageLabel: "Sprache wählen",
  },
} as const;

const brief = {
  EN: { more: "READ THE STORY", items: ["Complete presence. Every input matters. The circuit is our visual language; focus is the state we carry.", "Born in Hungary. Rooted in Central Europe. 47°N is where our story begins.", "For the riders we remember, and the people still riding beside us."], study: "REFLECTIVE STUDY", studyText: "A future hoodie concept: a visible grey cybersigil base with finer reflective lines nested inside. 47°N at the hood, a discreet cuff stitch. Normal light and direct-flash views; sample testing still to come." },
  HU: { more: "A TELJES TÖRTÉNET", items: ["Teljes jelenlét. Minden mozdulat számít. A pálya a képi világunk, a fókusz az állapot, amit továbbviszünk.", "Magyarországon született. Közép-Európában gyökerezik. A történetünk 47°N-nél kezdődik.", "Azokért, akikre emlékezünk, és azokért, akik még mellettünk motoroznak."], study: "REFLECTIVE LÁTVÁNYTERV", studyText: "Egy későbbi pulcsi terve: látható szürke cybersigil alap, benne finomabb fényvisszaverő vonalakkal. 47°N a kapucnin, apró hímzés a mandzsettán. Normál fény és vaku; a gyártási minták tesztelése még hátravan." },
  DE: { more: "DIE GANZE GESCHICHTE", items: ["Ganz im Moment. Jeder Impuls zählt. Die Rennstrecke prägt unsere Bildsprache, Fokus unsere Haltung.", "In Ungarn entstanden. In Mitteleuropa verwurzelt. Bei 47°N beginnt unsere Geschichte.", "Für die Menschen, an die wir denken, und die, die noch neben uns fahren."], study: "REFLEKTIERENDER ENTWURF", studyText: "Ein künftiges Hoodie-Konzept: eine sichtbare graue Cybersigil-Grafik mit feineren reflektierenden Linien im Inneren. 47°N an der Kapuze, dezente Stickerei am Bündchen. Normallicht und Direktblitz; Mustertests stehen noch aus." }
};

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return <span className={compact ? "brand-lockup compact" : "brand-lockup"}><b>FLOWSTATE</b><em>RACING</em>{!compact && <small>47°N — EUROPEAN DIVISION</small>}</span>;
}

function ProductArtwork({ product }: { product: Product }) {
  const { lang } = useLanguage(); const u = ui[lang];
  return <div className={`photo-visual ${product.visual}`}>
    <img src={sitePath(product.image!)} loading="lazy" alt={`${product.name}: ${u.mockup}`}/>
    <span className="view-360">{u.concept}</span>
  </div>;
}

export default function Home() {
  const { lang } = useLanguage();
  const u = ui[lang];
  const [notice, setNotice] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menu, setMenu] = useState(false);
  const [sizes, setSizes] = useState<Record<number, string>>({ 1: "M", 2: "M" });
  const [look, setLook] = useState(0);
  const [cartReady, setCartReady] = useState(false);
  const live = {
    EN: {cart:"YOUR BAG", conceptLabel:"PREORDER",dropIntro:"One hoodie. One tee. One jet tag. Review the confirmed product details and delivery dates before ordering."},
    HU: {cart:"KOSARAD",conceptLabel:"ELŐRENDELÉS",dropIntro:"Egy pulcsi. Egy póló. Egy jet tag. Rendelés előtt nézd át a termékadatokat és a vállalt kézbesítést."},
    DE: {cart:"DEIN WARENKORB",conceptLabel:"VORBESTELLUNG",dropIntro:"Ein Hoodie. Ein T-Shirt. Ein Jet Tag. Prüfe vor der Bestellung die Produktdetails und Liefertermine."}
  };
  const t = {...copy[lang], ...(launch.checkoutEnabled ? live[lang] : {})};

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("flowstate-cart") ?? "null");
      if (saved?.expiresAt > Date.now()) setCart(sanitizeCart(saved.items));
      else localStorage.removeItem("flowstate-cart");
    } catch {}
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (cartReady) try {
      if (cart.length) localStorage.setItem("flowstate-cart", JSON.stringify({ items: cart, expiresAt: Date.now() + 30 * 86400000 }));
      else localStorage.removeItem("flowstate-cart");
    } catch {}
  }, [cart, cartReady]);


  const itemCount = cart.reduce((n, item) => n + item.qty, 0);
  const total = useMemo(() => cart.reduce((sum, item) => sum + products.find((p) => p.id === item.id)!.huf * item.qty, 0), [cart]);
  const add = (id: number) => {
    setNotice(u.added);
    const size = sizes[id] ?? "ONE SIZE";
    setCart((current) => {
      const index = current.findIndex((item) => item.id === id && item.size === size);
      return index < 0 ? [...current, { id, size, qty: 1 }] : current.map((item, i) => i === index ? { ...item, qty: Math.min(10, item.qty + 1) } : item);
    });
  };
  const changeQty = (index: number, by: number) => setCart((current) => current.map((item, i) => i === index ? { ...item, qty: Math.min(10, item.qty + by) } : item).filter((item) => item.qty > 0));

  return <main id="top"><a className="skip-link" href="#drop">{u.skip}</a><p className="sr-only" role="status">{notice}</p>
    <header className="nav-shell">
      <a href="#top" aria-label="Flowstate Racing home"><BrandLockup compact/></a>
      <nav className={menu ? "nav-links open" : "nav-links"} aria-label={u.navigation}>
        <a href="#drop" onClick={() => setMenu(false)}>{t.nav[0]}</a>
        <a href="#manifesto" onClick={() => setMenu(false)}>{t.nav[1]}</a>
        <a href="#system" onClick={() => setMenu(false)}>{t.nav[2]}</a>
      </nav>
      <div className="nav-actions">
        <LanguageSwitcher/>
        <Sheet>
          <SheetTrigger asChild><button className="bag" aria-label={u.openBag}><ShoppingBag size={19}/><span>{itemCount}</span></button></SheetTrigger>
          <SheetContent className="cart-panel" aria-describedby={undefined} showCloseButton={false}><SheetClose className="cart-close" aria-label={u.close}><X/></SheetClose><SheetHeader><SheetTitle className="cart-title">{t.cart}</SheetTitle></SheetHeader>
            {cart.length === 0 ? <div className="empty-cart"><ShoppingBag/><p>{t.empty}</p><span>DROP 001 / ENTER THE FLOWSTATE</span></div> : <div className="cart-list">{cart.map((item, index) => { const p = products.find((x) => x.id === item.id)!; return <div className="cart-row" key={`${item.id}-${item.size}`}><div><small>{p.code} · {item.size === "ONE SIZE" ? u.oneSize : item.size}</small><strong>{p.name}</strong><span>{p.huf.toLocaleString("hu-HU")} FT</span></div><div className="qty"><button onClick={() => changeQty(index, -1)} aria-label={u.less}><Minus size={14}/></button>{item.qty}<button onClick={() => changeQty(index, 1)} aria-label={u.more}><Plus size={14}/></button></div></div>})}<div className="cart-total"><span>{t.total}</span><strong>{total.toLocaleString("hu-HU")} FT</strong></div>{launch.checkoutEnabled ? <Checkout items={cart} total={total}/> : <SheetClose asChild><a className="primary full" href="#access">{t.checkout}</a></SheetClose>}{!launch.checkoutEnabled && <p className="cart-note">{t.noCharge}</p>}</div>}
          </SheetContent>
        </Sheet>
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label={u.menu}>{menu ? <X/> : <Menu/>}</button>
      </div>
    </header>

    <section className="hero">
      <img fetchPriority="high" src={sitePath("/flowstate-hero-v2.webp")} alt="AI campaign concept: rider wearing the Flowstate hoodie on a black supersport, carbon helmet with red vents"/>
      <div className="hero-shade"/>
      <div className="hero-copy"><p className="eyebrow"><span/> {t.heroEyebrow}</p><h1>ENTER THE<br/><i>FLOWSTATE.</i></h1><p className="hero-sub">{t.heroSub}</p><div className="hero-actions"><a className="primary" href="#drop">{t.enter} <ArrowDownRight size={17}/></a><a className="text-link" href="#manifesto">{t.manifesto}</a></div></div>
      <div className="coordinate"><b>47°N</b><span>19°E / CENTRAL EUROPE</span></div>
      <div className="ticker"><div>FLOWSTATE RACING — 47°N — FOREVER YOUNG — DROP 001 — ENTER THE FLOWSTATE — FLOWSTATE RACING — 47°N — FOREVER YOUNG — DROP 001 — ENTER THE FLOWSTATE —</div></div>
    </section>

    <section className="drop-section" id="drop"><div className="section-head"><div><p className="eyebrow"><span/> {t.first}</p><h2>DROP 001<br/><i>ENTER THE FLOWSTATE</i></h2></div><p>{t.dropIntro}</p></div><div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div className="product-code">/{product.code}</div><ProductArtwork product={product}/><div className="product-info"><div><h3>{product.name}</h3><span className="concept-label">{t.conceptLabel}</span><p>{u.details[products.indexOf(product)]}</p></div><div className="price"><b>{product.huf.toLocaleString("hu-HU")} FT</b><span>€{product.eur}</span></div></div>{business.productInformation[product.id as 1|2|4][lang] && <details className="product-facts"><summary>{lang === "HU" ? "Termékadatok és méretek" : lang === "DE" ? "Produktdetails und Maße" : "Product details and measurements"}</summary><p>{business.productInformation[product.id as 1|2|4][lang]}</p><p>{business.manufacturerName} / {business.manufacturerAddress} / {business.manufacturerEmail}</p></details>}<div className="product-actions">{product.sizes && <select aria-label={`${u.size}: ${product.name}`} value={sizes[product.id]} onChange={(e) => setSizes({ ...sizes, [product.id]: e.target.value })}>{product.sizes.map((size) => <option key={size}>{size}</option>)}</select>}<button onClick={() => add(product.id)}>{t.add} <Plus size={17}/></button></div></article>)}</div></section>

    <section className="lookbook" aria-label="Flowstate campaign lookbook"><div className={look === 2 ? "lookbook-frame study-frame" : "lookbook-frame"}><img src={sitePath(look === 0 ? "/flowstate-hoodie.webp" : look === 1 ? "/flowstate-hero-v2.webp" : "/flowstate-reflective-study.webp")} alt={look === 2 ? brief[lang].studyText : u.mockup}/><span>LOOK 0{look + 1} / 47°N</span></div><div className="lookbook-copy"><p className="eyebrow"><span/> {look === 2 ? brief[lang].study : t.lookLabel}</p><h2>{look === 2 ? "AFTER DARK." : t.lookTitle}</h2><p>{look === 2 ? brief[lang].studyText : t.lookText}</p><button className="study-link" onClick={() => setLook(2)}>{brief[lang].study} ↗</button><div className="look-controls"><button onClick={() => setLook((look + 2) % 3)} aria-label={u.previous}><ChevronLeft/></button><b>0{look + 1} / 03</b><button onClick={() => setLook((look + 1) % 3)} aria-label={u.next}><ChevronRight/></button></div></div></section>

    <section className="manifesto manifesto-v2" id="manifesto">
      <div className="manifesto-grid-mark" aria-hidden="true"/>
      <div className="manifesto-topline"><span>{t.manifestoLabel}</span><small>{t.manifestoKicker}</small></div>
      <div className="manifesto-lead"><div><span className="manifesto-index">47°N / 001</span><h2>{u.manifesto.title} <i>{u.manifesto.emphasis}</i></h2></div><p>{u.manifesto.intro}</p></div>
      <div className="manifesto-signal"><div className="speed-lockup"><span>TRACK SYMBOL</span><strong>300</strong><small>KM/H</small></div><blockquote>“{t.manifestoQuote}”</blockquote><div className="focus-lines" aria-hidden="true"><span/><span/><span/><span/></div></div>
      <div className="manifesto-pillars">{t.pillars.map((pillar, i) => <article key={pillar[0]}><div className="pillar-head"><span>{pillar[0]}</span><small>{pillar[3]}</small></div><h3>{pillar[1]}</h3><p className="pillar-brief">{brief[lang].items[i]}</p><details className="pillar-details"><summary>{brief[lang].more}</summary><p>{[u.manifesto.focus, u.manifesto.origin, u.manifesto.memory][i]}</p></details></article>)}</div>
      <p className="manifesto-note">{u.manifesto.note}</p><div className="manifesto-footerline"><span>FLOWSTATE RACING</span><strong>47°N — EUROPEAN DIVISION</strong><span>FOREVER YOUNG</span></div>
    </section>

    <section className="system" id="system"><div><p className="eyebrow"><span/> {t.systemLabel}</p><h2>{t.system}</h2></div><ol>{t.steps.map((step, index) => <li key={step[0]}><b>0{index + 1}</b><div><strong>{step[0]}</strong><p>{step[1]}</p></div></li>)}</ol></section>

    <section className="access" id="access"><p className="eyebrow"><span/> {t.access}</p><h2>{t.accessTitle}</h2><p>{t.accessText}</p><SignupForm labels={{ email: t.email, join: t.join }}/><small>{t.privacy}</small></section>


    <footer><BrandLockup/><div><span>INSTAGRAM / @FLOWSTATE.RACING</span><span>TIKTOK / @FLOWSTATE.RACING</span>{["terms","privacy","cookies","shipping","imprint"].map((path,i)=><a key={path} href={sitePath(`/${path}/`)}>{u.footer[i]}</a>)}<a href={sitePath("/withdrawal/")}>{lang === "HU" ? "ELÁLLÁS" : lang === "DE" ? "WIDERRUF" : "WITHDRAWAL"}</a></div><p>© 2026 FLOWSTATE RACING.<br/>{u.origin}<br/>{u.disclaimer}<br/>{u.affiliation}</p></footer>
  </main>;
}
