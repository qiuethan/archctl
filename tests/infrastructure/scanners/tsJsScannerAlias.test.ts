import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import { tsJsScanner } from '../../../src/infrastructure/scanners/tsJsScanner';

// Mock the fs module
vi.mock('fs');

describe('tsJsScanner with Path Aliases', () => {
  const projectRoot = '/test/project';
  const file = {
    path: 'src/features/auth/login.ts',
    contents: `
      import { User } from '@/domain/user';
      import { Button } from '@components/Button';
      import { helper } from '@utils/helpers';
      import { config } from 'config'; 
    `,
    language: 'typescript',
  };

  const context = {
    projectRoot,
    tsBaseUrl: '.',
    tsPaths: {
      '@/*': ['src/*'],
      '@components/*': ['src/components/*'],
      '@utils/*': ['src/shared/utils/*'],
      'config': ['src/config/index.ts']
    }
  };

  it('should resolve aliases correctly', async () => {
    // Setup mock implementation for fs.existsSync
    vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
      const pathStr = p.toString();
      // Normalize for test matching
      const normalized = pathStr.replace(/\\/g, '/');
      return [
        '/test/project/src/domain/user.ts',
        '/test/project/src/components/Button.tsx',
        '/test/project/src/shared/utils/helpers.ts',
        '/test/project/src/config/index.ts'
      ].includes(normalized);
    });

    // Setup mock implementation for fs.statSync
    vi.mocked(fs.statSync).mockImplementation(() => ({
      isFile: () => true,
      isDirectory: () => false,
    } as any));

    const result = await tsJsScanner.scan(file, context);

    expect(result.edges).toHaveLength(4);

    const targets = result.edges?.map(e => e.to);
    expect(targets).toContain('src/domain/user.ts');
    expect(targets).toContain('src/components/Button.tsx');
    expect(targets).toContain('src/shared/utils/helpers.ts');
    expect(targets).toContain('src/config/index.ts');
  });

  it('should fail gracefully if alias does not resolve to a file', async () => {
     vi.mocked(fs.existsSync).mockReturnValue(false);
     
     const result = await tsJsScanner.scan(file, context);
     
     // Should not have resolved edges for aliases that don't exist on disk
     expect(result.edges).toHaveLength(0);
  });
});