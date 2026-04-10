export const N = 16;
export const C = 7;

export const PW = 4.0;
export const PH = 2.32;

export const MONTHS = [
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const EVENTS = [
  {
    month: 0,
    tag: "BACKGROUND",
    body: "Greta starts thinking\nabout the climate\ncrisis at home.",
  },
  {
    month: 1,
    tag: "PLANNING",
    body: "Preparing the first\nsolo strike for\nthe climate.",
  },
  {
    month: 0,
    tag: "SKOLSTREJK",
    body: "Greta begins school\nstrike outside Swedish\nparliament.",
  },
  {
    month: 1,
    tag: "MOVEMENT",
    body: 'Teenagers worldwide\njoin "Fridays For Future"\nschool strikes.',
  },
  {
    month: 2,
    tag: "SPEECH",
    body: 'Speaks at COP24 Poland:\n"You say you love your\nchildren above all else."',
  },
  {
    month: 3,
    tag: "NOMINATION",
    body: "Nominated for Nobel\nPeace Prize at age 16.",
  },
  {
    month: 4,
    tag: "PARLIAMENT",
    body: 'Addresses European\nParliament: "Our house\nis on fire."',
  },
  {
    month: 5,
    tag: "JOURNEY",
    body: "Sails Atlantic on a\nzero-carbon yacht to the\nUN Climate Summit.",
  },
  {
    month: 6,
    tag: "UN SPEECH",
    body: '"How dare you!"\ngoes viral worldwide\nat the UN.',
  },
  {
    month: 7,
    tag: "TIME",
    body: "Named TIME Magazine\nPerson of the Year 2019.",
  },
  {
    month: 8,
    tag: "GLOBAL",
    body: "4 million people join\nglobal climate strike\nled by Greta.",
  },
  {
    month: 9,
    tag: "DAVOS",
    body: "Speaks at World\nEconomic Forum\nin Davos.",
  },
  {
    month: 10,
    tag: "AWARD",
    body: "Amnesty International\nAmbassador of\nConscience award.",
  },
  {
    month: 11,
    tag: "LEGACY",
    body: '"The world is waking up.\nChange is coming,\nwhether you like it or not."',
  },
  {
    month: 0,
    tag: "STRIKE",
    body: "School strike movement\nspreads to over\n100 countries.",
  },
  {
    month: 1,
    tag: "FUTURE",
    body: "A new generation\ndemands action\non climate change.",
  },
] as const;

export type PathPoint = {
  x: number;
  y: number;
  z: number;
  rx: number;
  rz: number;
  W: number;
  H: number;
  op: number;
  cv: number;
};

export const PATH: PathPoint[] = [
  {
    x: 22.0,
    y: -56.0,
    z: -12.0,
    rx: -0.7,
    rz: 0.28,
    W: 0.98,
    H: 0.56,
    op: 0.04,
    cv: 0.38,
  },
  {
    x: 18.0,
    y: -42.0,
    z: -10.0,
    rx: -0.55,
    rz: 0.25,
    W: 1.19,
    H: 0.68,
    op: 0.1,
    cv: 0.35,
  },
  {
    x: 13.5,
    y: -30.0,
    z: -8.0,
    rx: -0.4,
    rz: 0.22,
    W: 1.41,
    H: 0.82,
    op: 0.18,
    cv: 0.3,
  },
  {
    x: 9.5,
    y: -21.0,
    z: -6.5,
    rx: -0.25,
    rz: 0.18,
    W: 1.71,
    H: 0.99,
    op: 0.28,
    cv: 0.25,
  },
  {
    x: 4.5,
    y: -13.0,
    z: -5.0,
    rx: -0.15,
    rz: 0.12,
    W: 1.95,
    H: 1.12,
    op: 0.46,
    cv: 0.18,
  },
  {
    x: -4.8,
    y: -7.0,
    z: -3.0,
    rx: -0.1,
    rz: 0.1,
    W: 2.28,
    H: 1.31,
    op: 0.7,
    cv: 0.22,
  },
  {
    x: 6.2,
    y: -3.2,
    z: -1.0,
    rx: -0.05,
    rz: 0.12,
    W: 2.6,
    H: 1.5,
    op: 0.88,
    cv: 0.22,
  },
  { x: 0.0, y: 0.1, z: 4.9, rx: 0.0, rz: 0.0, W: PW, H: PH, op: 1.0, cv: 0.0 },
  {
    x: -6.2,
    y: 3.2,
    z: -1.0,
    rx: 0.05,
    rz: -0.12,
    W: 2.6,
    H: 1.5,
    op: 0.88,
    cv: 0.22,
  },
  {
    x: 4.8,
    y: 7.0,
    z: -3.0,
    rx: 0.1,
    rz: 0.1,
    W: 2.28,
    H: 1.31,
    op: 0.7,
    cv: 0.22,
  },
  {
    x: -4.5,
    y: 13.0,
    z: -5.0,
    rx: 0.15,
    rz: 0.12,
    W: 1.95,
    H: 1.12,
    op: 0.46,
    cv: 0.18,
  },
  {
    x: -9.5,
    y: 21.0,
    z: -6.5,
    rx: 0.25,
    rz: 0.18,
    W: 1.71,
    H: 0.99,
    op: 0.28,
    cv: 0.25,
  },
  {
    x: -13.5,
    y: 30.0,
    z: -8.0,
    rx: 0.4,
    rz: 0.22,
    W: 1.41,
    H: 0.82,
    op: 0.18,
    cv: 0.3,
  },
  {
    x: -18.0,
    y: 42.0,
    z: -10.0,
    rx: 0.55,
    rz: 0.25,
    W: 1.19,
    H: 0.68,
    op: 0.1,
    cv: 0.35,
  },
  {
    x: -22.0,
    y: 56.0,
    z: -12.0,
    rx: 0.7,
    rz: 0.28,
    W: 0.98,
    H: 0.56,
    op: 0.04,
    cv: 0.38,
  },
];
