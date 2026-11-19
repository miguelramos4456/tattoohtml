/* ============================================================
   ALEXANDER KRANE — SITE CONTENT & CONFIGURATION
   ------------------------------------------------------------
   Every artist-specific fact, policy, price and photograph lives
   in this one file. Nothing here has been verified by the artist
   unless it says `verified: true`.

   Before launch, the artist should review every entry marked
   REVIEW and fill in everything marked TODO.
   ============================================================ */

window.AK_CONTENT = {

  /* ----------------------------------------------------------
     ARTIST
     REVIEW: carried over from the previous version of the site.
     Confirm the email, Instagram handle and city are correct.
  ---------------------------------------------------------- */
  artist: {
    name: 'Alexander Krane',
    city: 'Berlin',                         // REVIEW
    email: 'book@alexanderkrane.com',       // REVIEW
    instagram: 'alexanderkrane',            // REVIEW (handle only, no @)
    // Styles listed on the previous site. REVIEW.
    styles: ['Fine Line', 'Realism', 'Japanese', 'Blackwork', 'Geometric']
  },

  /* ----------------------------------------------------------
     CONSULTATION SUBMISSION
     endpoint: leave empty to use the email fallback (opens the
       visitor's email app with the summary pre-filled; nothing is
       sent until they press send).
     To receive submissions directly, create a form on a service
       such as Formspree (https://formspree.io), paste its endpoint
       URL here, e.g. 'https://formspree.io/f/xxxxxxx'. The site
       POSTs JSON and only reports success on a 2xx response.
  ---------------------------------------------------------- */
  submission: {
    endpoint: ''
  },

  /* ----------------------------------------------------------
     BUDGET RANGES (consultation question 6)
     TODO: the artist sets these. Leave empty to ask visitors for
     a free-form figure instead. Example:
       budgetRanges: ['Under €300', '€300 – €700', '€700 – €1,500', '€1,500+']
  ---------------------------------------------------------- */
  budgetRanges: [],
  currency: 'EUR',

  /* ----------------------------------------------------------
     PORTFOLIO
     TODO: add real, photographed work. Images go in
     assets/work/ (recommend 1600px on the long edge, WebP or
     JPEG, ~200–400 KB). One entry per piece:

     {
       src: 'assets/work/koi-forearm.webp',
       width: 1200, height: 1600,          // real pixel size, prevents layout shift
       alt: 'Black and grey koi tattoo wrapping a forearm',
       title: 'Koi',
       style: 'Japanese',                  // used for the filters
       placement: 'Forearm',
       type: 'Custom design',              // optional
       year: 2024,                         // optional
       note: 'Healed, eight weeks.'        // optional, short
     }

     Filters are generated from the `style` values actually
     present, so a style only shows up once there is work in it.
     Until this list has entries the gallery shows numbered,
     clearly-labelled empty plates. Add `?demo` to the page URL to
     preview the gallery interactions with labelled demo plates.
  ---------------------------------------------------------- */
  /* SAMPLE IMAGES: the eight entries below are AI-generated
     (Codex image generation) to show the gallery working. They
     are NOT Alexander's tattoos. Replace each `src` with real,
     photographed work, then delete `portfolioNote` below. */
  portfolioNote: 'Sample images shown while the portfolio is being photographed.',
  portfolio: [
    {
      src: 'assets/work/japanese-koi.webp', width: 933, height: 1400,
      alt: 'Japanese-style koi swimming through waves, half sleeve on the upper arm and shoulder',
      title: 'Koi against the current', style: 'Japanese', placement: 'Upper arm & shoulder', type: 'Half sleeve'
    },
    {
      src: 'assets/work/fine-line-botanical.webp', width: 1120, height: 1400,
      alt: 'Fine-line olive sprig tattoo along the inner forearm',
      title: 'Olive sprig', style: 'Fine Line', placement: 'Inner forearm'
    },
    {
      src: 'assets/work/realism-portrait.webp', width: 1120, height: 1400,
      alt: 'Black and grey realism tattoo of a classical statue face on the outer upper arm',
      title: 'Marble', style: 'Realism', placement: 'Outer upper arm'
    },
    {
      src: 'assets/work/fine-line-moth.webp', width: 1050, height: 1400,
      alt: 'Fine-line moth with dotwork shading across the upper back',
      title: 'Moth', style: 'Fine Line', placement: 'Upper back'
    },
    {
      src: 'assets/work/japanese-hannya.webp', width: 1120, height: 1400,
      alt: 'Japanese hannya mask with red peonies on the thigh',
      title: 'Hannya and peonies', style: 'Japanese', placement: 'Thigh'
    },
    {
      src: 'assets/work/geometric-sacred.webp', width: 1120, height: 1400,
      alt: 'Geometric interlocking circles with dotwork gradients on the outer forearm',
      title: 'Seed of life', style: 'Geometric', placement: 'Outer forearm'
    },
    {
      src: 'assets/work/realism-raven.webp', width: 1400, height: 933,
      alt: 'Black and grey realism raven perched on a branch on the calf',
      title: 'Raven', style: 'Realism', placement: 'Calf'
    },
    {
      src: 'assets/work/blackwork-ornamental.webp', width: 1050, height: 1400,
      alt: 'Blackwork ornamental mandala running down the spine',
      title: 'Spine ornament', style: 'Blackwork', placement: 'Spine'
    }
  ],

  /* ----------------------------------------------------------
     PHOTOGRAPHY
     assets/photo/hero.webp, studio.webp and detail.webp are
     AI-generated atmosphere images (made with Codex image
     generation). They are NOT photos of Alexander, his studio or
     his work. Replace them with real photographs before launch.
  ---------------------------------------------------------- */

  /* ----------------------------------------------------------
     ABOUT
     TODO: artist portrait at assets/img/portrait.webp (portrait
     orientation, ~1200×1500). Set `portrait` to that path when
     it exists.
     The bio below restates the working philosophy already on
     the previous site. Credentials from the previous site
     (years of experience, number of pieces, training in Tokyo and
     Amsterdam, studio in Mitte) were NOT carried over because
     they could not be verified. Add them back here once confirmed.
  ---------------------------------------------------------- */
  about: {
    portrait: '',                           // TODO
    portraitAlt: 'Portrait of Alexander Krane',
    statements: [                           // REVIEW
      'No two tattoos from the same conversation.',
      'Every line considered.',
      'Originals only.'
    ],
    bio: [                                  // REVIEW
      'Alexander Krane is an independent tattoo artist working in fine line, realism and Japanese-inspired work, with blackwork and geometric pieces alongside.',
      'Every piece starts as a conversation. Designs are drawn for the person and the placement, refined until they say exactly what was intended, and tattooed without rushing.'
    ]
  },

  /* ----------------------------------------------------------
     FAQ
     REVIEW ALL. These answers are deliberately general and make
     no promises about prices, timings or healing outcomes. The
     artist should replace them with their actual policies.
     `keywords` drive the question matcher; add the words visitors
     are likely to use.
  ---------------------------------------------------------- */
  faq: [
    {
      cat: 'Booking',
      q: 'How does booking work?',
      a: 'Start with the consultation on this page. It asks about your idea, placement, size and timing, and sends a summary to Alexander. He replies to discuss the design, confirm whether it is a good fit, and offer appointment options.',
      keywords: ['book', 'booking', 'appointment', 'how', 'start', 'schedule', 'consult', 'consultation', 'availability', 'available']
    },
    {
      cat: 'Booking',
      q: 'Do I need to pay a deposit?',
      a: 'If a deposit applies to your project, the amount and terms are confirmed in writing before your appointment is booked. Ask in your consultation if anything is unclear.',
      keywords: ['deposit', 'pay', 'payment', 'advance', 'refund', 'refundable', 'secure']
    },
    {
      cat: 'Booking',
      q: 'What does a tattoo cost?',
      a: 'Pricing depends on size, detail, placement and how many sessions the piece needs. You will get a quote after your consultation, before anything is booked.',
      keywords: ['cost', 'price', 'prices', 'pricing', 'how much', 'rate', 'hourly', 'quote', 'expensive', 'budget', 'money']
    },
    {
      cat: 'Booking',
      q: 'Can I cancel or reschedule?',
      a: 'Life happens. Let Alexander know as early as you can. How cancellations and rescheduling affect a deposit is set out when you book.',
      keywords: ['cancel', 'cancellation', 'reschedule', 'rebook', 'move', 'change date', 'move appointment', 'move my appointment', 'change appointment', 'change my appointment', 'postpone', 'late', 'miss', 'sick', 'ill']
    },
    {
      cat: 'Design',
      q: 'Do you do custom designs?',
      a: 'Yes. Work is drawn for you from the consultation, your references and the placement. Bring images that capture a feeling, a composition or a detail; they are a starting point, not something to copy.',
      keywords: ['custom', 'design', 'original', 'draw', 'drawing', 'idea', 'reference', 'references', 'copy', 'flash', 'sketch', 'artwork']
    },
    {
      cat: 'Design',
      q: 'When will I see my design?',
      a: 'Timing varies by project. Alexander will let you know how and when the design will be shared, and there is room to refine it before the session.',
      keywords: ['see', 'preview', 'when', 'design ready', 'changes', 'revisions', 'edit', 'adjust']
    },
    {
      cat: 'Session',
      q: 'How should I prepare for my session?',
      a: 'Sleep well, eat a proper meal beforehand, stay hydrated and wear clothes that give easy access to the placement. Avoid alcohol before your appointment. If you have a medical condition or take medication that could matter, mention it privately when you confirm your booking.',
      keywords: ['prepare', 'preparation', 'before', 'eat', 'sleep', 'wear', 'clothes', 'alcohol', 'drink', 'ready', 'bring']
    },
    {
      cat: 'Session',
      q: 'Will it hurt?',
      a: 'Everyone feels it differently. Areas over bone or with thinner skin (ribs, feet, hands, spine) are usually more sensitive than fleshier areas such as the outer arm or thigh. Breaks are always fine; just say.',
      keywords: ['pain', 'hurt', 'hurts', 'painful', 'sensitive', 'ouch', 'placement', 'ribs', 'numbing', 'numb']
    },
    {
      cat: 'Session',
      q: 'How long does a session take?',
      a: 'It depends on the size and detail of the piece. Small pieces may take a single short session; larger work is split over several. You will get an estimate when the design is agreed.',
      keywords: ['long', 'duration', 'hours', 'time', 'sessions', 'how many', 'length', 'sitting', 'day']
    },
    {
      cat: 'Healing',
      q: 'How do I look after a new tattoo?',
      a: 'You will receive aftercare instructions at the end of your session. Follow those rather than general advice online. Keep your hands clean when touching it, do not pick or scratch, and keep it out of direct sun and soaking water while it heals.',
      keywords: ['aftercare', 'after', 'care', 'clean', 'wash', 'cream', 'ointment', 'wrap', 'film', 'sun', 'swim', 'swimming', 'gym']
    },
    {
      cat: 'Healing',
      q: 'How long does healing take?',
      a: 'Healing varies from person to person and with size and placement. Peeling and itching during healing are common. If you notice increasing redness, heat, swelling or anything that worries you, contact a doctor and let Alexander know.',
      keywords: ['heal', 'healing', 'healed', 'peel', 'peeling', 'itch', 'itchy', 'scab', 'red', 'swelling', 'infection', 'infected', 'weeks']
    },
    {
      cat: 'Healing',
      q: 'Do you offer touch-ups?',
      a: 'Some areas need a small touch-up once healed. Get in touch after healing and send a clear photo. Touch-up terms are confirmed when you book.',
      keywords: ['touch up', 'touch-up', 'touchup', 'fix', 'faded', 'fade', 'patchy', 'redo', 'healed']
    }
  ]
};
