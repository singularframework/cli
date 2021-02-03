import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import http from 'http';
import { spawn } from '../lib/child-process';
import { loadSingularJson, projectGuard } from '../lib/events';
import { SgData } from '../lib/models';

app
.command('docs', 'builds the TypeDoc documentation from source code')

.option('-s --serve', 'serves the documentation')
.option('-p --port <number>', 'specifies the port number to serve the documentation on')
.validate(app.NUMBER)
.default(6001)

// Find and load singular.json
.on('validators:before', loadSingularJson)
// Operation can only be performed in a Singular project
.on('actions:before', projectGuard)

.actionDestruct(async ({ opts }) => {

  // If docs is disabled
  if ( ! app.data<SgData>().singular.project.docs ) {

    console.log('TypeDoc is disabled on this project!');
    return;

  }

  // Clean up
  await fs.remove(path.resolve(app.data<SgData>().projectRoot, 'docs'));

  // Build the documentation
  await spawn(
    // Syntax: node <path_to_typedoc> --out <path_to_docs_dir> <path_to_src_dir>
    'node',
    [
      path.join('..', 'node_modules', 'typedoc', 'bin', 'typedoc'),
      '--out',
      path.join('..', 'docs'),
      '.'
    ],
    {
      windowsHide: true,
      cwd: path.join(app.data<SgData>().projectRoot, 'src'),
      stdio: 'inherit'
    }
  );

  console.log('Documentation was built');

  // Serve if asked
  if ( ! opts.serve ) return;

  http.createServer((req, res) => {

    fs.readFile(path.join(app.data<SgData>().projectRoot, 'docs', req.url === '/' ? '/index.html' : req.url), (error, data) => {

      if ( error ) {

        res.writeHead(404);
        res.end(JSON.stringify(error));

        return;

      }

      res.writeHead(200);
      res.end(data);

    });

  })
  .listen(opts.port)
  .on('listening', () => {

    console.log(`Documentation is being served on localhost:${opts.port}`);

  });

});
