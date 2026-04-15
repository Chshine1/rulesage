import { Command } from 'commander';
import { createSnapshot } from '@rulesage/core';

export const snapshotCommand = new Command('snapshot')
  .description('Create a snapshot for codebase')
  .option('--scope <patterns...>', 'glob patterns for files to be included')
  .option('--ignore <patterns...>', 'glob patterns for files to be included')
  .option(
    '--ignore-file <path d="">',
    'path to the ignore file, .rulesageignore by default',
  )
  .action(
    async (options: {
      scope?: string[];
      ignore?: string[];
      ignoreFile: string;
    }) => {
      const projectRoot = process.cwd();

      await createSnapshot(projectRoot, {
        scope: options.scope || ['**/*'],
        ignore: options.ignore || [],
        ignoreFile: options.ignoreFile || '.rulesageignore',
      });
    },
  );
