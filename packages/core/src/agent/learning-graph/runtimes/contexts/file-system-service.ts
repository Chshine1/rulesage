import type { LearningContextSchema } from '../../learning.context';
import { z } from 'zod';

type IFileSystemService = z.infer<
  typeof LearningContextSchema.shape.fileSystem
>;

export class FileSystemService implements IFileSystemService {
  readFile(
    _projectRoot: string,
    _relativePath: string,
    _maxSize: number,
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  listDirectory(_projectRoot: string, _relativePath: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
