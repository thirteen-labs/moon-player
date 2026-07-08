const BASE = 'https://archive.org';
const TIMEOUT_MS = 15000;

export interface IAItem {
  identifier: string;
  title: string;
  description: string;
  creator: string;
  date: string;
  downloads: number;
  avgRating: number;
  subject: string[];
  mediatype: string;
  thumb: string;
  year: number;
}

export interface IAFile {
  name: string;
  source: string;
  format: string;
  size: number;
  length: number;
  height: number;
  width: number;
}

interface IASearchDoc {
  identifier: string;
  title?: string;
  description?: string;
  creator?: string;
  date?: string;
  downloads?: number;
  avg_rating?: number;
  subject?: string | string[];
  mediatype?: string;
  year?: number;
}

interface IASearchResponse {
  response: {
    numFound: number;
    docs: IASearchDoc[];
  };
}

export const CATEGORIES = [
  { id: 'movies', label: 'Movies', query: 'mediatype:movies AND collection:feature_films' },
  { id: 'anime', label: 'Anime', query: 'subject:anime AND mediatype:movies' },
  { id: 'series', label: 'Series', query: 'subject:"tv series" OR subject:"television" AND mediatype:movies' },
  { id: 'documentaries', label: 'Docs', query: 'subject:documentary AND mediatype:movies' },
] as const;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Archive.org returned ${res.status}: ${res.statusText}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function parseSubject(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') return raw.split(';').map((s) => s.trim()).filter(Boolean);
  return [];
}

function toIAItem(d: IASearchDoc): IAItem {
  const yearNum = d.year || (d.date ? parseInt(d.date.slice(0, 4), 10) : 0);
  return {
    identifier: d.identifier,
    title: d.title || 'Untitled',
    description: d.description || '',
    creator: d.creator || 'Unknown',
    date: d.date || '',
    downloads: d.downloads || 0,
    avgRating: d.avg_rating || 0,
    subject: parseSubject(d.subject),
    mediatype: d.mediatype || '',
    thumb: `https://archive.org/services/img/${d.identifier}`,
    year: isNaN(yearNum) ? 0 : yearNum,
  };
}

function findBestVideo(files: IAFile[]): IAFile | null {
  const videos = files.filter(
    (f) => f.format === 'MPEG4' || f.format === 'h.264',
  ).filter((f) => {
    const name = f.name.toLowerCase();
    return !name.endsWith('.srt') && !name.endsWith('.vtt') &&
           !name.includes('_thumbs') && !name.includes('_txt');
  });

  if (videos.length === 0) return null;

  videos.sort((a, b) => {
    const aScore = (a.height || 0) + (a.width || 0);
    const bScore = (b.height || 0) + (b.width || 0);
    return bScore - aScore;
  });

  return videos[0];
}

export const InternetArchiveService = {
  async search(query: string, page: number = 1, rows: number = 30): Promise<{ items: IAItem[]; total: number }> {
    const url = `${BASE}/advancedsearch.php?q=${encodeURIComponent(query)}` +
      `&fl[]=identifier,title,description,creator,date,downloads,avg_rating,subject,mediatype,year` +
      `&sort=downloads+desc&rows=${rows}&page=${page}&output=json`;

    const res = await fetchWithTimeout(url);
    const data: IASearchResponse = await res.json();

    const items: IAItem[] = (data.response.docs || []).map(toIAItem);

    return { items, total: data.response.numFound };
  },

  async getDetails(identifier: string): Promise<{ item: IAItem | null; files: IAFile[]; videoUrl: string | null }> {
    const res = await fetchWithTimeout(`${BASE}/metadata/${encodeURIComponent(identifier)}`);
    const data: { metadata: Record<string, unknown>; files: Array<Record<string, unknown>> } = await res.json();

    const files: IAFile[] = [];
    for (const f of data.files || []) {
      const name = String(f.name || '');
      const source = String(f.source || '');
      const format = String(f.format || '');
      if (!name || name.startsWith('_')) continue;
      if (!source || !format) continue;
      files.push({
        name,
        source,
        format,
        size: Number(f.size) || 0,
        length: Number(f.length) || 0,
        height: Number(f.height) || 0,
        width: Number(f.width) || 0,
      });
    }

    const bestVideo = findBestVideo(files);
    const videoUrl = bestVideo
      ? `${BASE}/download/${identifier}/${bestVideo.name}`
      : null;

    const md = data.metadata || {};
    const yearNum = md.year ? Number(md.year) : (md.date ? parseInt(String(md.date).slice(0, 4), 10) : 0);
    const item: IAItem = {
      identifier,
      title: String(md.title || identifier),
      description: String(md.description || ''),
      creator: String(md.creator || 'Unknown'),
      date: String(md.date || ''),
      downloads: Number(md.downloads) || 0,
      avgRating: Number(md.avg_rating) || 0,
      subject: parseSubject(md.subject),
      mediatype: String(md.mediatype || ''),
      thumb: `https://archive.org/services/img/${identifier}`,
      year: isNaN(yearNum) ? 0 : yearNum,
    };

    return { item, files, videoUrl };
  },
};
