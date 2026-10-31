/* Palettes and scene data for the procedurally drawn cover art.

   Every cover in the gallery is generated as an inline SVG instead of shipping
   photos, so the whole app stays tiny, offline friendly and sharp at any size. */

export interface GatePalette {
  sky: string[];
  moon: string;
  lamp: string;
  water: string[];
  mtn: string[];
  petal: string;
  torii: string;
}
export interface PagodaPalette {
  sky: string[];
  sun: string;
  far: string;
  near: string;
  hill: string;
  pag: string;
  fol: string[];
  blossom: string;
  mist: string;
}
export interface KoiPalette {
  bg: string[];
  light: string;
  pad: string[];
  flower: string[];
  k1: string[];
  k2: string[];
}
export interface SnowPalette {
  sky: string[];
  moon: string;
  pine: string;
  snow: string[];
}
export interface SeaPalette {
  sky: string[];
  sun: string;
  sea: string[];
  cliff: string;
}
export interface BambooPalette {
  bg: string[];
  moon: string;
  back: string;
  front: string;
  node: string;
  leaf: string;
}

export const PAL = {
  gate: {
    night: {
      sky: ['#150F3D', '#52267F', '#E4557A', '#FFB885'],
      moon: '#FFF3D6',
      lamp: '#FFC46B',
      water: ['#4A2A7C', '#0C0828'],
      mtn: ['#6B3A92', '#3A2270'],
      petal: '#FFC2D4',
      torii: '#E8452E',
    },
    dawn: {
      sky: ['#0B1F4A', '#1F5FA8', '#7FD0E0', '#FFE9B5'],
      moon: '#F4FAFF',
      lamp: '#FFD98A',
      water: ['#1F5FA8', '#071634'],
      mtn: ['#3F86B8', '#1B3F78'],
      petal: '#FFFFFF',
      torii: '#F2603F',
    },
    ember: {
      sky: ['#2A0F2E', '#8A2A4A', '#F0623F', '#FFC27A'],
      moon: '#FFE7BD',
      lamp: '#FFB347',
      water: ['#7A2A4A', '#1A0A1E'],
      mtn: ['#A23A58', '#4A1A3A'],
      petal: '#FFD2A8',
      torii: '#E8452E',
    },
  } satisfies Record<string, GatePalette>,

  pagoda: {
    pink: {
      sky: ['#FFE3BE', '#F68FA6', '#6E58C8'],
      sun: '#FFF6DD',
      far: '#B58BD6',
      near: '#7A5CBF',
      hill: '#241659',
      pag: '#1A1048',
      fol: ['#F2688F', '#E04E7D', '#C8406E'],
      blossom: '#FFC2D4',
      mist: '#FFD0C0',
    },
    autumn: {
      sky: ['#FFE0A8', '#FF9B5A', '#7A3A7A'],
      sun: '#FFF3D0',
      far: '#D79AA0',
      near: '#A55A80',
      hill: '#3A1A50',
      pag: '#2A1040',
      fol: ['#FF8A3D', '#E8602A', '#B8401E'],
      blossom: '#FFD08A',
      mist: '#FFD0A0',
    },
  } satisfies Record<string, PagodaPalette>,

  koi: {
    teal: {
      bg: ['#1D8A8F', '#0C4468', '#071B3C'],
      light: '#BFF7E8',
      pad: ['#35A887', '#2B8F77', '#3FB893'],
      flower: ['#FFC2D4', '#FF8FB0'],
      k1: ['#FF7438', '#FFF1E6', '#FF9A63'],
      k2: ['#F4F0E8', '#FF7438', '#E9E2D6'],
    },
    violet: {
      bg: ['#5B3FA0', '#2B2070', '#120B3A'],
      light: '#E0D0FF',
      pad: ['#6FB3A0', '#4F9A8A', '#7FC8B0'],
      flower: ['#FFD6E8', '#FF9CC0'],
      k1: ['#FF5A7A', '#FFEFF2', '#FF8FA6'],
      k2: ['#FFE9A8', '#FF5A7A', '#F2D88A'],
    },
  } satisfies Record<string, KoiPalette>,

  snow: {
    dusk: {
      sky: ['#16205E', '#5568C4', '#F3C7D6'],
      moon: '#FFF3DA',
      pine: '#2A3A86',
      snow: ['#F4F6FF', '#B7C3EC'],
    },
    midnight: {
      sky: ['#080C30', '#25358F', '#7C8FE0'],
      moon: '#E8F0FF',
      pine: '#141E5C',
      snow: ['#E6ECFF', '#8FA0D8'],
    },
    rose: {
      sky: ['#2A1550', '#9A4A8A', '#FFC4B0'],
      moon: '#FFF0E0',
      pine: '#4A2468',
      snow: ['#FFF2F2', '#D9B8D8'],
    },
  } satisfies Record<string, SnowPalette>,

  sea: {
    sunset: {
      sky: ['#5B2A86', '#FF6B6B', '#FFB36B'],
      sun: '#FFF1D6',
      sea: ['#7A2F7E', '#1A0F3C'],
      cliff: '#130B30',
    },
    teal: {
      sky: ['#2A4A8A', '#6FB6C8', '#BDE8E0'],
      sun: '#FFFFFF',
      sea: ['#2F6F9A', '#0C2A4A'],
      cliff: '#0A1A30',
    },
  } satisfies Record<string, SeaPalette>,

  bamboo: {
    green: {
      bg: ['#0A2A2E', '#0E4A44', '#071E24'],
      moon: '#F2FFE8',
      back: '#1A6B54',
      front: '#0F4A3C',
      node: '#082E26',
      leaf: '#2E9A74',
    },
    blue: {
      bg: ['#0A1A3A', '#12365E', '#071026'],
      moon: '#EAF4FF',
      back: '#1E5C8A',
      front: '#123E66',
      node: '#071A33',
      leaf: '#3E8AC0',
    },
  } satisfies Record<string, BambooPalette>,
} as const;

export type PaletteGroup = keyof typeof PAL;
