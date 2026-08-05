import type { VideoExtension, SubtitleExtension } from '../library/types';

export const VIDEO_EXTENSIONS: VideoExtension[] = [
  '.mp4', '.mkv', '.avi', '.mov', '.wmv',
  '.flv', '.webm', '.m4v', '.3gp', '.ts',
  '.mts', '.m2ts', '.ogv', '.divx', '.asf',
];

export const SUBTITLE_EXTENSIONS: SubtitleExtension[] = [
  '.srt', '.ass', '.ssa', '.vtt', '.sub', '.idx', '.pgs',
];

const videoExtSet = new Set(VIDEO_EXTENSIONS);
const subtitleExtSet = new Set(SUBTITLE_EXTENSIONS);

export function isVideoFile(filename: string): boolean {
  const ext = getExtension(filename);
  return videoExtSet.has(ext as VideoExtension);
}

export function isSubtitleFile(filename: string): boolean {
  const ext = getExtension(filename);
  return subtitleExtSet.has(ext as SubtitleExtension);
}

export function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx).toLowerCase();
}

export function getFileNameWithoutExt(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? filename : filename.slice(0, idx);
}

export function inferLanguageFromFilename(filename: string): string {
  const withoutExt = getFileNameWithoutExt(filename);
  const parts = withoutExt.split(/[._\-\s]+/);
  const langMap: Record<string, string> = {
    en: 'English', eng: 'English',
    es: 'Spanish', spa: 'Spanish',
    fr: 'French', fra: 'French',
    de: 'German', deu: 'German',
    it: 'Italian', ita: 'Italian',
    pt: 'Portuguese', por: 'Portuguese',
    ru: 'Russian', rus: 'Russian',
    ja: 'Japanese', jpn: 'Japanese',
    zh: 'Chinese', zho: 'Chinese',
    ko: 'Korean', kor: 'Korean',
    ar: 'Arabic', ara: 'Arabic',
    hi: 'Hindi', hin: 'Hindi',
    tr: 'Turkish', tur: 'Turkish',
    nl: 'Dutch', nld: 'Dutch',
    pl: 'Polish', pol: 'Polish',
    sv: 'Swedish', swe: 'Swedish',
    da: 'Danish', dan: 'Danish',
    fi: 'Finnish', fin: 'Finnish',
    nb: 'Norwegian', nob: 'Norwegian',
    cs: 'Czech', ces: 'Czech',
    hu: 'Hungarian', hun: 'Hungarian',
    ro: 'Romanian', ron: 'Romanian',
    th: 'Thai', tha: 'Thai',
    vi: 'Vietnamese', vie: 'Vietnamese',
  };

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (langMap[lower]) return langMap[lower];
  }

  return 'Unknown';
}
