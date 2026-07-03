const BASE = 'https://archive.org';

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

interface IASearchResponse {
  response: {
    numFound: number;
    docs: Array<{
      identifier: string;
      title?: string;
      description?: string;
      creator?: string;
      date?: string;
      downloads?: number;
      avg_rating?: number;
      subject?: string[];
      mediatype?: string;
      year?: number;
    }>;
  };
}

interface IAMetadataResponse {
  metadata: Record<string, unknown>;
  files: Array<{
    name: string;
    source: string;
    format: string;
    size?: number;
    length?: number;
    height?: number;
    width?: number;
    [key: string]: unknown;
  }>;
}

export const CATEGORIES = [
  { id: 'movies', label: 'Movies', query: 'mediatype:movies AND collection:feature_films' },
  { id: 'anime', label: 'Anime', query: 'subject:anime AND mediatype:movies' },
  { id: 'series', label: 'Series', query: 'subject:"tv series" OR subject:"television" AND mediatype:movies' },
  { id: 'documentaries', label: 'Docs', query: 'subject:documentary AND mediatype:movies' },
] as const;

function findBestVideo(files: IAFile[]): IAFile | null {
  const videos = files.filter(
    (f) => f.format === 'MPEG4' || f.format === 'h.264'
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
      `&sort[]=&sort=downloads+desc&rows=${rows}&page=${page}&output=json`;

    const res = await fetch(url);
    const data: IASearchResponse = await res.json();

    const items: IAItem[] = (data.response.docs || []).map((d) => ({
      identifier: d.identifier,
      title: d.title || 'Untitled',
      description: d.description || '',
      creator: d.creator || 'Unknown',
      date: d.date || '',
      downloads: d.downloads || 0,
      avgRating: d.avg_rating || 0,
      subject: d.subject || [],
      mediatype: d.mediatype || '',
      thumb: `https://archive.org/services/img/${d.identifier}`,
      year: d.year || 0,
    }));

    return { items, total: data.response.numFound };
  },

  async getDetails(identifier: string): Promise<{ item: IAItem | null; files: IAFile[]; videoUrl: string | null }> {
    const res = await fetch(`${BASE}/metadata/${encodeURIComponent(identifier)}`);
    const data: IAMetadataResponse = await res.json();

    const rawFiles: Array<Record<string, unknown>> = data.files || [];
    const files: IAFile[] = [];
    for (const f of rawFiles) {
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
    const item: IAItem = {
      identifier,
      title: (md.title as string) || identifier,
      description: (md.description as string) || '',
      creator: (md.creator as string) || 'Unknown',
      date: (md.date as string) || '',
      downloads: (md.downloads as number) || 0,
      avgRating: (md.avg_rating as number) || 0,
      subject: Array.isArray(md.subject) ? md.subject as string[] : [],
      mediatype: (md.mediatype as string) || '',
      thumb: `https://archive.org/services/img/${identifier}`,
      year: (md.year as number) || 0,
    };

    return { item, files, videoUrl };
  },
};
