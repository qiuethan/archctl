import { minimatch } from 'minimatch';
import type { ContextMapping } from '../types/config';

export function resolveContextForFile(
  filePath: string,
  mappings: ContextMapping[] = []
): string | null {
  const normalized = filePath.replace(/\\/g, '/');
  const sorted = [...mappings].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const mapping of sorted) {
    const included = mapping.include.some((pattern) =>
      minimatch(normalized, pattern, { dot: true })
    );

    if (!included) continue;

    const excluded = mapping.exclude?.some((pattern) =>
      minimatch(normalized, pattern, { dot: true })
    );

    if (excluded) continue;

    return mapping.context;
  }

  return null;
}

export function isPathInPublicApi(filePath: string, mappings: ContextMapping[] = []): boolean {
  const normalized = filePath.replace(/\\/g, '/');

  for (const mapping of mappings) {
    if (!mapping.public || mapping.public.length === 0) continue;

    const isPublic = mapping.public.some((pattern) =>
      minimatch(normalized, pattern, { dot: true })
    );

    if (isPublic) return true;
  }

  return false;
}
