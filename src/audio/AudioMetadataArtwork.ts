import { File, Paths, FileMode } from 'expo-file-system';
import { getThumbnailAsync } from 'expo-video-thumbnails';
import * as MediaLibrary from 'expo-media-library';
import type { AudioFile, AudioMetadata, AudioScanCallback } from './types';
import { getFileNameWithoutExt } from '../utils/fileExtensions';
import { MmkvService } from '../storage/MmkvService';

const ARTWORK_CACHE_PREFIX = 'audio_art_';
const MAX_HEADER_BYTES = 2 * 1024 * 1024;

export class AudioMetadataArtworkExtractor {
  private artworkCacheDir: string;

  constructor(artworkCacheDir: string = Paths.cache.uri + '/audio_art/') {
    this.artworkCacheDir = artworkCacheDir;
  }

  async extract(file: AudioFile): Promise<{
    metadata: AudioMetadata | null;
    artworkUri: string | null;
  }> {
    const metadata = await this.extractMetadata(file);
    const artworkUri = await this.extractArtwork(file);
    return { metadata, artworkUri };
  }

  private async extractMetadata(file: AudioFile): Promise<AudioMetadata | null> {
    const defaultMetadata: AudioMetadata = {
      duration: 0,
      title: getFileNameWithoutExt(file.name),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      albumArtist: '',
      genre: '',
      year: 0,
      trackNumber: 0,
      trackTotal: 0,
      discNumber: 0,
      discTotal: 0,
      bitrate: 0,
      sampleRate: 0,
      audioCodec: file.extension.replace('.', '').toUpperCase(),
      channels: 0,
      composer: '',
    };

    try {
      switch (file.extension) {
        case '.mp3':
          return await this.parseID3v2(file, defaultMetadata);
        case '.flac':
          return await this.parseFLAC(file, defaultMetadata);
        case '.m4a':
        case '.aac':
        case '.alac':
          return await this.parseMP4(file, defaultMetadata);
        case '.ogg':
        case '.opus':
          return await this.parseOGG(file, defaultMetadata);
        default:
          return defaultMetadata;
      }
    } catch {
      return defaultMetadata;
    }
  }

  private async extractArtwork(file: AudioFile): Promise<string | null> {
    try {
      const cached = MmkvService.getString(`${ARTWORK_CACHE_PREFIX}${file.uri}`);
      const cachedPath = cached ? `${this.artworkCacheDir}${cached}` : null;
      if (cachedPath) {
        const cachedFile = new File(cachedPath);
        if (cachedFile.exists) return cachedPath;
      }

      const m4a = ['.m4a', '.aac', '.alac'];
      if (m4a.includes(file.extension)) {
        return await this.extractM4AArtwork(file);
      }

      if (file.extension === '.mp3') {
        return await this.extractID3Artwork(file);
      }

      if (file.extension === '.flac') {
        return await this.extractFLACArtwork(file);
      }

      return await this.tryMediaLibraryArtwork(file);
    } catch {
      return null;
    }
  }

  async extractBatch(
    files: AudioFile[],
    onProgress?: AudioScanCallback,
  ): Promise<Map<string, { metadata: AudioMetadata | null; artworkUri: string | null }>> {
    const results = new Map<string, { metadata: AudioMetadata | null; artworkUri: string | null }>();
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      onProgress?.({
        totalFiles,
        scannedFiles: i + 1,
        currentPath: file.uri,
        phase: 'extracting',
      });

      const extracted = await this.extract(file);
      results.set(file.uri, extracted);
    }

    return results;
  }

  private async parseID3v2(file: AudioFile, fallback: AudioMetadata): Promise<AudioMetadata> {
    const f = new File(file.uri);
    const header = await this.readHeader(f);
    if (header.length < 10) return fallback;

    const decoder = new TextDecoder();
    if (decoder.decode(header.slice(0, 3)) !== 'ID3') return fallback;

    const metadata = { ...fallback };
    const tagSize = syncsafeInt(header, 6, 4);
    const framesEnd = Math.min(10 + tagSize, header.length);

    let pos = 10;
    while (pos + 10 <= framesEnd) {
      const frameId = decoder.decode(header.slice(pos, pos + 4));
      if (frameId.charCodeAt(0) === 0) break;

      let frameSize: number;
      if (header[4] >= 4) {
        frameSize = syncsafeInt(header, pos + 4, 4);
      } else {
        frameSize = readUint32BE(header, pos + 4);
      }

      if (frameSize === 0) break;
      pos += 10;
      if (pos + frameSize > framesEnd) break;

      const frameData = header.slice(pos, pos + frameSize);

      switch (frameId) {
        case 'TIT2':
          metadata.title = decodeID3String(frameData) || metadata.title;
          break;
        case 'TPE1':
          metadata.artist = decodeID3String(frameData) || metadata.artist;
          break;
        case 'TALB':
          metadata.album = decodeID3String(frameData) || metadata.album;
          break;
        case 'TPE2':
          metadata.albumArtist = decodeID3String(frameData);
          break;
        case 'TCON':
          metadata.genre = decodeID3String(frameData) || metadata.genre;
          break;
        case 'TYER': case 'TDRC':
          const yearStr = decodeID3String(frameData);
          if (yearStr) metadata.year = parseInt(yearStr, 10) || 0;
          break;
        case 'TRCK':
          const trck = decodeID3String(frameData);
          if (trck) {
            const parts = trck.split('/');
            metadata.trackNumber = parseInt(parts[0], 10) || 0;
            metadata.trackTotal = parseInt(parts[1], 10) || 0;
          }
          break;
        case 'TPOS':
          const dpos = decodeID3String(frameData);
          if (dpos) {
            const parts = dpos.split('/');
            metadata.discNumber = parseInt(parts[0], 10) || 0;
            metadata.discTotal = parseInt(parts[1], 10) || 0;
          }
          break;
        case 'TBPM':
          const bpm = decodeID3String(frameData);
          if (bpm) metadata.bitrate = parseInt(bpm, 10) * 1000 || 0;
          break;
        case 'TCOM':
          metadata.composer = decodeID3String(frameData) || metadata.composer;
          break;
      }

      pos += frameSize;
    }

    return metadata;
  }

  private async extractID3Artwork(file: AudioFile): Promise<string | null> {
    const f = new File(file.uri);
    const header = await this.readHeader(f);
    if (header.length < 10) return null;

    const decoder = new TextDecoder();
    if (decoder.decode(header.slice(0, 3)) !== 'ID3') return null;

    const tagSize = syncsafeInt(header, 6, 4);
    const framesEnd = Math.min(10 + tagSize, header.length);

    let pos = 10;
    while (pos + 10 <= framesEnd) {
      const frameId = decoder.decode(header.slice(pos, pos + 4));
      if (frameId.charCodeAt(0) === 0) break;

      let frameSize: number;
      if (header[4] >= 4) {
        frameSize = syncsafeInt(header, pos + 4, 4);
      } else {
        frameSize = readUint32BE(header, pos + 4);
      }

      if (frameSize === 0) break;
      pos += 10;
      if (pos + frameSize > framesEnd) break;

      if (frameId === 'APIC') {
        try {
          let offset = pos;
          const encoding = header[offset++];

          let mimeEnd = offset;
          while (mimeEnd < pos + frameSize && header[mimeEnd] !== 0) mimeEnd++;
          const mimeType = decoder.decode(header.slice(offset, mimeEnd));
          offset = mimeEnd + 1;
          offset += 1;

          if (encoding === 0 || encoding === 3) {
            while (offset < pos + frameSize && header[offset] !== 0) offset++;
            offset++;
          } else {
            offset += 2;
            while (offset + 1 < pos + frameSize && (header[offset] !== 0 || header[offset + 1] !== 0)) offset += 2;
            offset += 2;
          }

          const imageData = header.slice(offset, pos + frameSize);
          if (imageData.length === 0) return null;

          const ext = mimeType.split('/').pop() || 'jpg';
          const fileName = `art_${file.uri.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
          const filePath = `${this.artworkCacheDir}${fileName}`;

          const dest = new File(filePath);
          dest.write(imageData);

          MmkvService.setString(`${ARTWORK_CACHE_PREFIX}${file.uri}`, fileName);
          return filePath;
        } catch {
          return null;
        }
      }

      pos += frameSize;
    }

    return null;
  }

  private async parseFLAC(file: AudioFile, fallback: AudioMetadata): Promise<AudioMetadata> {
    const metadata = { ...fallback };
    const f = new File(file.uri);
    const data = await this.readHeader(f);
    if (data.length < 42) return metadata;

    const decoder = new TextDecoder();
    if (decoder.decode(data.slice(0, 4)) !== 'fLaC') return metadata;

    let pos = 4;
    let lastBlock = false;

    while (!lastBlock && pos + 4 <= data.length) {
      const isLast = (data[pos] & 0x80) !== 0;
      const blockType = data[pos] & 0x7f;
      const blockSize = readUint24BE(data, pos);
      pos += 4;

      if (pos + blockSize > data.length) break;

      if (blockType === 0 && blockSize >= 18) {
        metadata.sampleRate = readUint20BE(data, pos + 14);
        metadata.channels = ((data[pos + 17] >> 1) & 0x07) + 1;
      }

      if (blockType === 4) {
        this.parseVorbisComments(data.slice(pos, pos + blockSize), metadata);
      }

      lastBlock = isLast;
      pos += blockSize;
    }

    return metadata;
  }

  private async extractFLACArtwork(file: AudioFile): Promise<string | null> {
    const f = new File(file.uri);
    const data = await this.readHeader(f);
    if (data.length < 4) return null;

    const decoder = new TextDecoder();
    if (decoder.decode(data.slice(0, 4)) !== 'fLaC') return null;

    let pos = 4;
    let lastBlock = false;

    while (!lastBlock && pos + 4 <= data.length) {
      const isLast = (data[pos] & 0x80) !== 0;
      const blockType = data[pos] & 0x7f;
      const blockSize = readUint24BE(data, pos);
      pos += 4;

      if (pos + blockSize > data.length) break;

      if (blockType === 6 && blockSize > 4) {
        const picType = data[pos + 3];
        if (picType !== 3) { pos += blockSize; lastBlock = isLast; continue; }

        let offset = pos + 4;
        let mimeEnd = offset;
        while (mimeEnd < pos + blockSize && data[mimeEnd] !== 0) mimeEnd++;
        const mimeType = decoder.decode(data.slice(offset, mimeEnd));
        offset = mimeEnd + 1;

        offset += 4 + 4 + 4 + 4;
        offset += 4;

        while (offset < pos + blockSize && data[offset] !== 0) offset++;
        offset++;

        const imageData = data.slice(offset, pos + blockSize);
        if (imageData.length === 0) return null;

        const ext = mimeType.split('/').pop() || 'jpg';
        const fileName = `art_${file.uri.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
        const filePath = `${this.artworkCacheDir}${fileName}`;

        const dest = new File(filePath);
        dest.write(imageData);

        MmkvService.setString(`${ARTWORK_CACHE_PREFIX}${file.uri}`, fileName);
        return filePath;
      }

      lastBlock = isLast;
      pos += blockSize;
    }

    return null;
  }

  private async parseMP4(file: AudioFile, fallback: AudioMetadata): Promise<AudioMetadata> {
    const metadata = { ...fallback };
    const f = new File(file.uri);
    const data = await this.readHeader(f);
    const meta = this.findMoovMeta(data);

    if (meta.length > 0) {
      const decoder = new TextDecoder();
      const tags: Record<string, string> = {};
      let idx = 0;
      while (idx < meta.length - 8) {
        const atomLen = readUint32BE(meta, idx);
        if (atomLen < 8) break;
        const atomName = decoder.decode(meta.slice(idx + 4, idx + 8));

        if (atomName === 'data' && idx + 16 <= idx + atomLen) {
          const namePos = idx - 16;
          if (namePos >= 0) {
            let key = '';
            for (let k = namePos; k < idx; k++) {
              const c = meta[k];
              if (c >= 0x20 && c <= 0x7e) key += String.fromCharCode(c);
            }
            const valueStart = idx + 16;
            const valueLen = atomLen - 16;
            if (valueLen > 0) {
              tags[key] = decoder.decode(meta.slice(valueStart, valueStart + valueLen)).replace(/\0/g, '');
            }
          }
        }
        idx += atomLen;
      }

      if (tags['©nam']) metadata.title = tags['©nam'];
      if (tags['©ART']) metadata.artist = tags['©ART'];
      if (tags['©alb']) metadata.album = tags['©alb'];
      if (tags['©gen']) metadata.genre = tags['©gen'];
      if (tags['©day']) metadata.year = parseInt(tags['©day'], 10) || 0;
      if (tags['©wrt']) metadata.composer = tags['©wrt'];
      if (tags['trkn']) metadata.trackNumber = parseInt(tags['trkn'], 10) || 0;
      if (tags['aART']) metadata.albumArtist = tags['aART'];
    }

    return metadata;
  }

  private findMoovMeta(data: Uint8Array): Uint8Array {
    const decoder = new TextDecoder();
    let pos = 0;
    while (pos + 8 <= data.length) {
      const atomLen = readUint32BE(data, pos);
      if (atomLen < 8) break;
      const atomName = decoder.decode(data.slice(pos + 4, pos + 8));

      if (atomName === 'moov' || atomName === 'udta') {
        return this.findMoovMeta(data.slice(pos + 8, pos + atomLen));
      }
      if (atomName === 'meta') {
        return data.slice(pos + 12, pos + atomLen);
      }
      if (atomName === 'ilst') {
        return data.slice(pos + 8, pos + atomLen);
      }

      pos += atomLen;
    }
    return new Uint8Array(0);
  }

  private async extractM4AArtwork(file: AudioFile): Promise<string | null> {
    try {
      const result = await getThumbnailAsync(file.uri, { time: 0, quality: 0.7 });
      if (result?.uri) {
        const fileName = `art_${file.uri.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
        const destPath = `${this.artworkCacheDir}${fileName}`;
        const src = new File(result.uri);
        const dest = new File(destPath);
        await src.copy(dest);
        MmkvService.setString(`${ARTWORK_CACHE_PREFIX}${file.uri}`, fileName);
        return destPath;
      }
    } catch {}

    return null;
  }

  private async parseOGG(file: AudioFile, fallback: AudioMetadata): Promise<AudioMetadata> {
    const metadata = { ...fallback };
    const f = new File(file.uri);
    const data = await this.readHeader(f);

    const decoder = new TextDecoder();
    if (data.length < 4) return metadata;
    if (decoder.decode(data.slice(0, 4)) !== 'OggS') return metadata;

    const content = decoder.decode(data);
    const comments = content.match(/TITLE=([^\r\n]+)/i);
    const artist = content.match(/ARTIST=([^\r\n]+)/i);
    const album = content.match(/ALBUM=([^\r\n]+)/i);
    const genre = content.match(/GENRE=([^\r\n]+)/i);
    const date = content.match(/DATE=([^\r\n]+)/i);
    const track = content.match(/TRACKNUMBER=([^\r\n]+)/i);

    if (comments) metadata.title = comments[1].trim();
    if (artist) metadata.artist = artist[1].trim();
    if (album) metadata.album = album[1].trim();
    if (genre) metadata.genre = genre[1].trim();
    if (date) metadata.year = parseInt(date[1], 10) || 0;
    if (track) metadata.trackNumber = parseInt(track[1], 10) || 0;

    const sampleRateMatch = content.match(/SampleRate=(\d+)/);
    if (sampleRateMatch) metadata.sampleRate = parseInt(sampleRateMatch[1], 10) || 0;
    const channelsMatch = content.match(/Channels=(\d+)/);
    if (channelsMatch) metadata.channels = parseInt(channelsMatch[1], 10) || 0;

    return metadata;
  }

  private parseVorbisComments(data: Uint8Array, metadata: AudioMetadata): void {
    try {
      const decoder = new TextDecoder();
      let pos = 0;

      if (pos + 4 > data.length) return;
      const vendorLen = readUint32LE(data, pos);
      pos += 4 + vendorLen;

      if (pos + 4 > data.length) return;
      const commentCount = readUint32LE(data, pos);
      pos += 4;

      for (let i = 0; i < commentCount && pos + 4 <= data.length; i++) {
        const commentLen = readUint32LE(data, pos);
        pos += 4;
        if (pos + commentLen > data.length) break;

        const comment = decoder.decode(data.slice(pos, pos + commentLen));
        pos += commentLen;

        const eqIdx = comment.indexOf('=');
        if (eqIdx === -1) continue;
        const key = comment.slice(0, eqIdx).toUpperCase();
        const value = comment.slice(eqIdx + 1);

        switch (key) {
          case 'TITLE': metadata.title = value; break;
          case 'ARTIST': metadata.artist = value; break;
          case 'ALBUM': metadata.album = value; break;
          case 'ALBUMARTIST': metadata.albumArtist = value; break;
          case 'GENRE': metadata.genre = value; break;
          case 'DATE': metadata.year = parseInt(value, 10) || 0; break;
          case 'TRACKNUMBER': metadata.trackNumber = parseInt(value, 10) || 0; break;
          case 'TRACKTOTAL': metadata.trackTotal = parseInt(value, 10) || 0; break;
          case 'DISCNUMBER': metadata.discNumber = parseInt(value, 10) || 0; break;
          case 'DISCTOTAL': metadata.discTotal = parseInt(value, 10) || 0; break;
          case 'COMPOSER': metadata.composer = value; break;
        }
      }
    } catch {}
  }

  private async tryMediaLibraryArtwork(file: AudioFile): Promise<string | null> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return null;

      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 50,
      });

      for (const asset of assets.assets) {
        if (asset.uri === file.uri) {
          const info = await MediaLibrary.getAssetInfoAsync(asset.id);
          if (info) {
            const fileName = `art_${file.uri.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
            const destPath = `${this.artworkCacheDir}${fileName}`;
            try {
              const src = new File(info.localUri || info.uri);
              const dest = new File(destPath);
              await src.copy(dest);
              MmkvService.setString(`${ARTWORK_CACHE_PREFIX}${file.uri}`, fileName);
              return destPath;
            } catch {}
          }
          break;
        }
      }
    } catch {}

    return null;
  }

  private async readHeader(f: File): Promise<Uint8Array> {
    if (!f.exists) return new Uint8Array(0);
    const readSize = Math.min(MAX_HEADER_BYTES, f.size);
    const handle = f.open(FileMode.ReadOnly);
    try {
      const bytes = handle.readBytes(readSize);
      return bytes;
    } finally {
      handle.close();
    }
  }

  clearCache(): void {
    const keys = MmkvService.getAllKeys();
    for (const key of keys) {
      if (key.startsWith(ARTWORK_CACHE_PREFIX)) {
        MmkvService.remove(key);
      }
    }
  }

  getCachedArtwork(audioUri: string): string | undefined {
    const cached = MmkvService.getString(`${ARTWORK_CACHE_PREFIX}${audioUri}`);
    return cached ? `${this.artworkCacheDir}${cached}` : undefined;
  }
}

function syncsafeInt(data: Uint8Array, offset: number, length: number): number {
  let value = 0;
  for (let i = 0; i < length; i++) {
    value = (value << 7) | (data[offset + i] & 0x7f);
  }
  return value;
}

function readUint32BE(data: Uint8Array, offset: number): number {
  return ((data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]) >>> 0;
}

function readUint24BE(data: Uint8Array, offset: number): number {
  return ((data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2]) >>> 0;
}

function readUint20BE(data: Uint8Array, offset: number): number {
  return ((data[offset] << 12) | (data[offset + 1] << 4) | (data[offset + 2] >> 4)) >>> 0;
}

function readUint32LE(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0;
}

function decodeID3String(data: Uint8Array): string {
  if (data.length === 0) return '';
  const encoding = data[0];
  let str: string;
  if (encoding === 0 || encoding === 3) {
    const nullIdx = data.indexOf(0, 1);
    const end = nullIdx === -1 ? data.length : nullIdx;
    str = new TextDecoder('latin1').decode(data.slice(1, end));
  } else if (encoding === 1) {
    let end = data.length;
    for (let i = 1; i < data.length - 1; i += 2) {
      if (data[i] === 0 && data[i + 1] === 0) { end = i; break; }
    }
    str = new TextDecoder('utf-16le').decode(data.slice(1, end));
  } else {
    str = new TextDecoder('utf-16be').decode(data.slice(1));
  }
  return str.replace(/[\x00-\x1f]/g, '').trim();
}
