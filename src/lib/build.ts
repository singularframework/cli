import path from 'path';
import fs from 'fs-extra';
import terser from 'terser';
import glob from 'glob';
import ora from 'ora';
import chalk from 'chalk';
import { spawn } from './child-process';
import { SgData } from './models';

/** Builds the source code into dist. */
export async function build(singularData: SgData, minify?: boolean) {

  const spinner = ora().start();

  // Clean up
  spinner.text = 'Cleaning up';

  await fs.remove(path.join(singularData.projectRoot, 'dist'));

  // Build the source code
  spinner.text = 'Building the server';

  const child = spawn(
    'node',
    [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ],
    {
      windowsHide: true,
      cwd: singularData.projectRoot,
      stdio: ['ignore', 'ignore', 'pipe']
    }
  );

  const stderrCache: string[] = [];
  child.ref.stderr.on('data', data => stderrCache.push(chalk.redBright(data)));

  const results = await child.promise;

  if ( results.code !== 0 ) {

    spinner.fail(chalk.redBright('Build failed!'));
    console.error(stderrCache.join('\n'));

    process.exit(1);

  }

  // Copy the assets
  spinner.text = 'Copying assets';

  for ( const asset of singularData.singular.project.assets || [] ) {

    await fs.copy(
      path.resolve(singularData.projectRoot, 'src', asset),
      path.resolve(singularData.projectRoot, 'dist', asset)
    );

  }

  // Minify if asked
  if ( minify ) {

    spinner.text = 'Minifying the build';

    // Scan for all .js files inside dist directory
    const jsFiles = glob.sync('**/*.js', { cwd: path.resolve(singularData.projectRoot, 'dist') });

    // Minify each file
    for ( const file of jsFiles ) {

      const filepath = path.resolve(singularData.projectRoot, 'dist', file);
      const code = await fs.readFile(filepath, { encoding: 'utf-8' });
      const results = await terser.minify(code, {
        sourceMap: { content: 'inline', url: 'inline' },
        mangle: { toplevel: true },
        ecma: 2018
      });

      await fs.writeFile(filepath, results.code);

    }

    // Scan for all .json files inside dist directory
    const jsonFiles = glob.sync('**/*.json', { cwd: path.resolve(singularData.projectRoot, 'dist') });

    // Minify each file
    for ( const file of jsonFiles ) {

      const filepath = path.resolve(singularData.projectRoot, 'dist', file);
      const data = await fs.readJson(filepath, { encoding: 'utf-8' });

      await fs.writeJson(filepath, data);

    }

  }

  spinner.succeed('Build successfull')

}
