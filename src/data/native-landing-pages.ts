/**
 * The register of native Astro landing pages.
 *
 * A native landing page is a real route file — `src/pages/<slug>.astro` — built
 * and deployed with the Worker. Adding an entry here is what makes the CMS
 * aware of it: the admin can see it, copy its link, and hand it a product page.
 * Without an entry the route still answers on its URL, but the operator has no
 * way to know it exists.
 *
 * **This is a manifest, not discovery.** Cloudflare Workers bundles routes and
 * cannot enumerate `src/pages/` at runtime, so the list is written down and
 * compiled in. `validateNativeLandingPages` fails the build on a duplicate or
 * an incomplete entry rather than shipping a register that misrepresents the
 * site.
 *
 * To add one:
 *   1. create `src/pages/<slug>.astro` (see `docs/LANDING-PAGES.md`);
 *   2. add its entry below, with `slug` matching the filename exactly;
 *   3. deploy. The CMS picks it up on the next landing-page list load, or
 *      within the hour from the scheduled re-sync — the sitemap with it.
 *
 * To remove one: delete both. Removing only the file leaves a register entry
 * pointing at a 404; removing only the entry leaves an unlisted live URL.
 */
export type NativeLandingPage = {
  /** Must equal the route filename, and is the public path: `/<slug>`. */
  slug: string;
  /** Shown in the CMS list. */
  title: string;
  /** The product this page sells, by product slug. */
  productSlug: string;
  /** Shown in the CMS list beneath the title. */
  description: string;
  /** Optional list thumbnail (root-relative or https). Without it the lists
   *  show the product's photo. */
  image?: string;
  /** A page can be registered before it is ready to be linked. */
  isActive?: boolean;
};

// Ported from petanisejahtera.com (2026-10-06), the brand this install becomes.
export const nativeLandingPages: NativeLandingPage[] = [
  {
    slug: 'bensu-jagung',
    title: 'Bensu Jagung',
    productSlug: 'bensu',
    description: 'Jagung kuning, kerdil, dan pertumbuhan mandek.',
    image: '/images/landing/bensu-jagung/hero-utama.webp',
  },
  {
    slug: 'aussie-sawit-ganoderma',
    title: 'Aussie Sawit Ganoderma',
    productSlug: 'aussie',
    description: 'Recovery sawit kuning, busuk akar/batang/pucuk, dan Ganoderma.',
    image: '/images/landing/aussie/ganoderma.webp',
  },
  {
    slug: 'aussie-buah-landak',
    title: 'Aussie Buah Landak',
    productSlug: 'aussie',
    description: 'Tandan sawit landak, buah jarang, dan biji kosong.',
    image: '/images/landing/aussie/aussie-buah-landak-hero.webp',
  },
  {
    slug: 'saratoga-padi',
    title: 'Saratoga Padi',
    productSlug: 'saratoga',
    description: 'Gabah hampa dan pengisian bulir padi.',
    image: '/images/landing/saratoga-padi/hero-padi.webp',
  },
  {
    slug: 'saratoga-anggrek',
    title: 'Saratoga Anggrek',
    productSlug: 'saratoga',
    description: 'Anggrek tidak keluar tangkai dan bunga pucat.',
    image: '/images/landing/saratoga-anggrek/hero-anggrek.webp',
  },
  {
    slug: 'saratoga-anthurium',
    title: 'Saratoga Anthurium',
    productSlug: 'saratoga',
    description: 'Anthurium hanya berdaun dan bunga kusam.',
    image: '/images/landing/saratoga-anthurium/hero-anthurium.webp',
  },
  // Ported from petanisawit.com with their slugs unchanged, for the ads that
  // already point at them.
  {
    slug: 'aussie-formulabaru',
    title: 'Aussie Formula Baru',
    productSlug: 'aussie',
    description: 'Formula baru lawan jamur Ganoderma (dari petanisawit.com).',
    image: '/images/landing/aussie-formulabaru/01.webp',
  },
  {
    slug: 'aussie-formulabaru-evrpro',
    title: 'Aussie Formula Baru (2)',
    productSlug: 'aussie',
    description: 'Sama dengan aussie-formulabaru, slug iklan kedua (dari petanisawit.com).',
    image: '/images/landing/aussie-formulabaru/01.webp',
  },
  {
    slug: 'aussie-edukasi1',
    title: 'Aussie Edukasi Jamur Sawit',
    productSlug: 'aussie',
    description: 'Pucuk busuk, Ganoderma, bercak daun, dan cara pakai (dari petanisawit.com).',
    image: '/images/landing/aussie-edukasi1/01.webp',
  },
  {
    slug: 'busukpucuk-simple',
    title: 'Aussie Busuk Pucuk (Simple)',
    productSlug: 'aussie',
    description: 'Busuk pucuk kelapa sawit, versi teks (dari petanisawit.com).',
    image: '/images/landing/busukpucuk-simple/01.webp',
  },
  {
    slug: 'aussie-busukpucuk',
    title: 'Aussie Busuk Pucuk',
    productSlug: 'aussie',
    description: 'Obat pucuk busuk kelapa sawit, versi gambar (dari petanisawit.com).',
    image: '/images/landing/aussie-busukpucuk/01.webp',
  },
  {
    slug: 'aussie-buahlandak',
    title: 'Aussie Buahlandak',
    productSlug: 'aussie',
    description: 'Buah landak sawit, versi gambar (dari petanisawit.com).',
    image: '/images/landing/aussie-buahlandak/01.webp',
  },
];

/**
 * Other top-level route files this install serves that are not landing pages —
 * a legacy slug that 301s to a renamed page, say. A CMS landing page on one of
 * these slugs would save and never be reachable, because the route file
 * answers first, so the CMS refuses them. Every entry in `nativeLandingPages`
 * is refused the same way without being repeated here.
 */
export const installRouteSlugs: string[] = [];
