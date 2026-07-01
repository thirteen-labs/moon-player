export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface SubtitleTrack {
  cues: SubtitleCue[];
  format: 'srt' | 'ass' | 'vtt';
  title?: string;
}

function parseTimeSRT(time: string): number {
  const parts = time.replace(',', '.').split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
}

function parseTimeASS(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
}

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\{[^}]+\}/g, '').replace(/\\N/g, '\n');
}

export function parseSRT(content: string): SubtitleTrack {
  const cues: SubtitleCue[] = [];
  const blocks = content.trim().replace(/\r\n/g, '\n').split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 2) continue;

    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const start = parseTimeSRT(startStr);
    const end = parseTimeSRT(endStr);
    const text = lines.slice(lines.indexOf(timeLine) + 1).join('\n');

    const idLine = lines[0] !== timeLine ? lines[0] : String(cues.length + 1);

    cues.push({
      id: idLine,
      start,
      end,
      text: stripTags(text),
    });
  }

  return { cues, format: 'srt' };
}

export function parseVTT(content: string): SubtitleTrack {
  let cleaned = content.replace(/\r\n/g, '\n');
  const headerMatch = cleaned.match(/^WEBVTT.*\n/);
  if (headerMatch) {
    cleaned = cleaned.slice(headerMatch[0].length);
  }
  cleaned = cleaned.replace(/(\n\d{2}:\d{2}:\d{2}\.\d{3}) -->/g, '$1 -->');
  return parseSRT(cleaned);
}

export function parseASS(content: string): SubtitleTrack {
  const cues: SubtitleCue[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let inEvents = false;
  let formatLine = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[Events]')) {
      inEvents = true;
      continue;
    }
    if (inEvents && trimmed.startsWith('Format:')) {
      formatLine = trimmed;
      continue;
    }
    if (inEvents && trimmed.startsWith('Dialogue:')) {
      const parts = trimmed.split(',');
      const fmtParts = formatLine.replace('Format:', '').trim().split(/\s*,\s*/);

      const startIdx = fmtParts.indexOf('Start');
      const endIdx = fmtParts.indexOf('End');
      const textIdx = fmtParts.indexOf('Text');

      if (startIdx === -1 || endIdx === -1 || textIdx === -1) continue;

      const start = parseTimeASS(parts[startIdx].trim());
      const end = parseTimeASS(parts[endIdx].trim());

      const textStart = parts.slice(0, textIdx + 1).join(',').length;
      const text = trimmed.slice(textStart + 1).replace(/^[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,/, '');

      cues.push({
        id: String(cues.length + 1),
        start,
        end,
        text: stripTags(text),
      });
    }
  }

  return { cues, format: 'ass' };
}

export function getActiveCues(cues: SubtitleCue[], time: number): SubtitleCue[] {
  return cues.filter((c) => time >= c.start && time <= c.end);
}
