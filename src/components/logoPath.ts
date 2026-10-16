/*
 * The app's mark, as on the app icon (1024 px): a slanted, handwritten "Cc"
 * in one line. It starts as a small c curled up inside, then runs out and
 * round as the big C, ending in a cut-off tail at the bottom.
 */
export const LOGO_PATH =
  'M626 384C566 336 470 350 446 420C424 490 490 532 558 496' +
  'C652 442 714 310 692 224C674 158 606 138 542 150' +
  'C400 172 268 332 238 522C212 692 290 822 420 814C502 808 562 762 602 702';
/** The whole line, end to end. */
export const LOGO_LENGTH = 2031;
/** As thick as on the icon. */
export const LOGO_LINE = 70;
/** Just round the mark, line included: 533 wide, 737 tall. */
export const LOGO_BOUNDS = { x: 198, y: 112, width: 533, height: 737 };

/*
 * More capitals in the mark's hand, for headings that start with them: same
 * slant, same line: the D with a small loop at its stem's foot, the P
 * with a cap stroke over a stem cut off clean like the C's tail.
 */
export type LogoLetter = 'C' | 'D' | 'P';

/** One band top to bottom for every letter, so they share a baseline. */
export const LETTER_TOP = 112;
export const LETTER_HEIGHT = 752;

/**
 * Each letter's path and box, and how far the next letter sits from the
 * box (icon units): measured on screen so the clear space between the
 * letter's ink and the next letter's matches the text's own (~1.3 pt).
 * `afterTall`, if set, is for a next letter that stands as tall as it (an
 * ascender or a capital), which can't tuck under it as a short one can.
 */
export const LOGO_LETTERS: Record<
  LogoLetter,
  {
    path: string;
    x: number;
    width: number;
    after: number;
    afterTall?: number;
  }
> = {
  C: {
    path: LOGO_PATH,
    x: LOGO_BOUNDS.x,
    width: LOGO_BOUNDS.width,
    // It opens to the right: what follows tucks in under its top end, so
    // the white between (on average, across the lowercase) matches the
    // text's own open C. A tall one (the h of "Chats") would run into
    // that top end, so it keeps clear of it.
    after: -100,
    afterTall: 10,
  },
  // Down the stem, a loop at its foot, round the bowl, back over the top.
  D: {
    path:
      'M562 176C528 400 470 620 410 784C392 834 318 840 306 800' +
      'C294 756 360 738 430 768C560 826 726 764 768 600' +
      'C812 420 730 200 556 168C440 148 338 200 328 280',
    x: 270,
    width: 545,
    after: 12,
  },
  // A cap stroke sweeping in from the left and round as the bowl, then the
  // slanted stem down through it, cut off clean at its foot.
  P: {
    path:
      'M300 300C330 220 420 170 520 160C690 142 806 214 792 320' +
      'C778 424 650 478 520 462M520 230C490 420 450 640 400 836',
    x: 265,
    width: 563,
    // Short letters tuck in under the bowl; tall ones keep clear of it.
    after: -65,
    afterTall: 30,
  },
};

/** Letters that reach up past the lowercase: ascenders and capitals. */
const TALL = /[\p{Lu}bdfhklt]/u;

/** How far `next` sits from the letter's box (icon units). */
export const kernAfter = (letter: LogoLetter, next: string) => {
  const { after, afterTall } = LOGO_LETTERS[letter];
  return afterTall !== undefined && TALL.test(next) ? afterTall : after;
};

export const isLogoLetter = (char: string): char is LogoLetter =>
  char in LOGO_LETTERS;
