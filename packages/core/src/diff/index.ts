import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { simpleGit } from 'simple-git';
import { dbInstance, getDb } from '../db/client';
import { Snapshot, snapshots } from '../db/schema';
import { FileDiff } from '../agent/state';
import { minimatch } from 'minimatch';
import { desc } from 'drizzle-orm';

export interface SnapshotOptions {
  scope?: string[]; // glob patterns to include
  ignore?: string[]; // glob patterns to exclude
  ignoreFile?: string; // path to ignore file (like .gitignore)
}

async function hashFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function getFiles(
  root: string,
  options: SnapshotOptions,
): Promise<string[]> {
  const ignorePatterns: string[] = [];

  if (options.ignoreFile) {
    const content = await fs.readFile(
      path.join(root, options.ignoreFile),
      'utf-8',
    );
    ignorePatterns.push(
      ...content.split('\n').filter((l) => l.trim() && !l.startsWith('#')),
    );
  }
  if (options.ignore) {
    ignorePatterns.push(...options.ignore);
  }

  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(root, fullPath);

      const isIgnored = ignorePatterns.some((p) =>
        minimatch(relativePath, p, { dot: true }),
      );
      if (isIgnored) continue;

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        if (options.scope && options.scope.length > 0) {
          const isInScope = options.scope.some((p) =>
            minimatch(relativePath, p, { dot: true }),
          );
          if (!isInScope) continue;
        }
        files.push(relativePath);
      }
    }
  }

  await walk(root);
  return files;
}

export async function createSnapshot(
  projectRoot: string,
  options: SnapshotOptions,
): Promise<Snapshot | undefined> {
  await dbInstance.initialize();

  const files = await getFiles(projectRoot, options);
  const fileHashes: Record<string, string> = {};

  for (const file of files) {
    const fullPath = path.join(projectRoot, file);
    try {
      fileHashes[file] = await hashFile(fullPath);
    } catch (error) {
      console.warn(`Failed to hash ${file}:`, error);
    }
  }

  return await getDb()
    .insert(snapshots)
    .values({
      scope: { includes: options.scope || [], excludes: options.ignore || [] },
      fileHashes,
    })
    .returning()
    .then((rows) => rows[0]);
}

export async function getLatestSnapshot(): Promise<Snapshot | null> {
  await dbInstance.initialize();

  if (dbInstance.db === null) {
    throw new Error();
  }
  const result = await getDb()
    .select()
    .from(snapshots)
    .orderBy(desc(snapshots.createdAt))
    .limit(1);

  return result[0] || null;
}

export async function computeDiff(snapshot: Snapshot): Promise<FileDiff[]> {
  const projectRoot = process.cwd();
  const diffs: FileDiff[] = [];

  const oldHashes = snapshot.fileHashes;

  const currentFiles = new Set<string>();

  const allFiles = await getFiles(projectRoot, {
    scope: snapshot.scope.includes,
    ignore: snapshot.scope.excludes,
  });

  for (const file of allFiles) {
    currentFiles.add(file);
    const fullPath = path.join(projectRoot, file);

    try {
      const newHash = await hashFile(fullPath);
      const oldHash = oldHashes[file];

      if (!oldHash || oldHash !== newHash) {
        const newContent = await fs.readFile(fullPath, 'utf-8');
        let oldContent = '';

        if (oldHash) {
          try {
            const git = simpleGit(projectRoot);
            oldContent = await git.show([`HEAD:${file}`]);
          } catch {
            oldContent = '';
          }
        }

        const language = path.extname(file).slice(1) || 'text';

        diffs.push({
          filePath: file,
          language,
          oldContent,
          newContent,
          hunks: [
            {
              oldStart: 1,
              oldLines: oldContent.split('\n').length,
              newStart: 1,
              newLines: newContent.split('\n').length,
              lines: [
                `- ${oldContent.substring(0, 100)}...`,
                `+ ${newContent.substring(0, 100)}...`,
              ],
            },
          ],
        });
      }
    } catch (error) {
      console.warn(`Failed to process ${file}:`, error);
    }
  }

  for (const file of Object.keys(oldHashes)) {
    if (!currentFiles.has(file)) {
      diffs.push({
        filePath: file,
        language: path.extname(file).slice(1) || 'text',
        oldContent: '[deleted]',
        newContent: '',
        hunks: [
          {
            oldStart: 1,
            oldLines: 1,
            newStart: 0,
            newLines: 0,
            lines: [`- [deleted file]`],
          },
        ],
      });
    }
  }

  return diffs;
}
