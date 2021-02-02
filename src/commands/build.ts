import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import terser from 'terser';
import glob from 'glob';
import { loadSingularJson } from '../common/events';
import { spawn } from '../common/child-process';
import { SgData } from '../common/models';

app
.command('build', 'builds the server')
.alias('b')

.option('-m --minify', 'minifies the build')

.on('validators:before', loadSingularJson)

.actionDestruct(async ({ opts }) => {

  // Clean up
  console.log('Cleaning up...');

  await fs.remove(path.join(app.data<SgData>().projectRoot, 'dist'));

  // Build the source code
  console.log('Building the server...');

  await spawn(
    'node',
    [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ],
    {
      windowsHide: true,
      cwd: app.data<SgData>().projectRoot,
      stdio: 'inherit'
    }
  );

  // Copy the assets
  console.log('Copying assets...');

  for ( const asset of app.data<SgData>().singular.project.assets || [] ) {

    await fs.copy(
      path.resolve(app.data<SgData>().projectRoot, 'src', asset),
      path.resolve(app.data<SgData>().projectRoot, 'dist', asset)
    );

  }

  // Minify is asked
  if ( opts.minify ) {

    console.log('Minifying the build...');

    // Scan for all .js files inside dist directory
    const jsFiles = glob.sync('**/*.js', { cwd: path.resolve(app.data<SgData>().projectRoot, 'dist') });

    // Minify each file
    for ( const file of jsFiles ) {

      const filepath = path.resolve(app.data<SgData>().projectRoot, 'dist', file);
      const code = await fs.readFile(filepath, { encoding: 'utf-8' });
      const results = await terser.minify(code, {
        sourceMap: { content: 'inline', url: 'inline' },
        mangle: { toplevel: true },
        ecma: 2018
      });

      await fs.writeFile(filepath, results.code);

    }

    // Scan for all .json files inside dist directory
    const jsonFiles = glob.sync('**/*.json', { cwd: path.resolve(app.data<SgData>().projectRoot, 'dist') });

    // Minify each file
    for ( const file of jsonFiles ) {

      const filepath = path.resolve(app.data<SgData>().projectRoot, 'dist', file);
      const data = await fs.readJson(filepath, { encoding: 'utf-8' });

      await fs.writeJson(filepath, data);

    }

  }

  console.log('Done!');

});
