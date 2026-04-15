import { Command } from 'commander';
import { runCommitWorkflow } from '@rulesage/core';
import { getLatestSnapshot, computeDiff } from '@rulesage/core';

export const commitCommand = new Command('commit')
  .description('Analyze codebase diff and learn coding rules')
  .requiredOption(
    '-m, --message <message>',
    'explanation to the intent of codebase diffs',
  )
  .action(async (options: { message: string }) => {
    const snapshot = await getLatestSnapshot();
    if (!snapshot) {
      console.error(
        'Snapshot not found, run `rulesage snapshot` to create one',
      );
      process.exit(1);
    }

    const diffs = await computeDiff(snapshot);
    if (diffs.length === 0) {
      console.log('No diffs found');
      return;
    }

    await runCommitWorkflow({
      diffs,
      message: options.message,
      projectRoot: process.cwd(),
    });
  });
