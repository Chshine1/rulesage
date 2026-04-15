import { Command } from 'commander';
import { snapshotCommand } from './commands/snapshot';
import { commitCommand } from './commands/commit';

const program = new Command();

program
  .name('rulesage')
  .description(
    'A CLI tool that learns and applies coding rules from codebase diffs',
  )
  .version('0.0.1');

program.addCommand(snapshotCommand);
program.addCommand(commitCommand);

program.parse();
