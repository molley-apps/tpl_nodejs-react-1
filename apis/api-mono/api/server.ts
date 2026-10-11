// Enable source map support for accurate TypeScript line numbers in logs
import 'source-map-support/register';

import '@/http/nodegen/utils/logger';
import app from '@/app';
import appCli from '@/app.cli';
import startup from '@/utils/startup';
import run from '@/cli/run';
import config from '@/config';
import packageJson from './package.json';

const cliInput = appCli();
const PORT = cliInput.port || config.port;

app(PORT)
  .then(async (http) => {
    if (cliInput['run-script']) {
      // CLI path (dev only — run.ts throws in production): the DB must be
      // connected before the script runs, so await startup first.
      await startup();
      return run(cliInput['run-script'], cliInput);
    }

    // Server path: open the port immediately so the container is "started",
    // then connect Mongo + finish startup in the background.
    //
    // What gates traffic depends on the startup probe. With a TCP check the
    // pod is "started" the moment it listens and takes traffic mid-connect —
    // those requests buffer for bufferTimeoutMS and fail. With an HTTP startup
    // probe on /readyz Cloud Run holds traffic until Mongo is actually up (see
    // utils/readinessProbe.ts; the deployer must point the probe there).
    const server = await http.start();
    console.log(`${packageJson.name}:${packageJson.version} server listening on port: ${PORT}`);
    startup()
      .then(() => console.log('api startup complete — Mongo connected'))
      .catch((e) => {
        // Every connect attempt failed. Stop accepting requests BEFORE exiting:
        // the port is already open, so without this the pod spends its dying
        // moments taking traffic it cannot serve and failing every request.
        // Closing first makes Cloud Run route elsewhere while this pod is
        // replaced. Exit regardless — a pod that cannot reach Mongo is no use
        // alive, and the close callback never fires while connections are held
        // open, hence the timer.
        console.error('api startup failed, exiting:', e);
        const exit = (): never => process.exit(1);
        setTimeout(exit, 5000).unref();
        server.close(exit);
      });
  })
  .catch((e) => {
    throw e;
  });
