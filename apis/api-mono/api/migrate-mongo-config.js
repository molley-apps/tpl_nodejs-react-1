// eslint-disable-next-line no-undef,@typescript-eslint/no-var-requires
const packageJson = require('./package.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires,no-undef
const mongoConnectionService = require('./build/src/services/MongoConnectionService').default;

// eslint-disable-next-line no-undef
module.exports = {
  mongodb: {
    // Same URI the app connects with. Importing the service is inert — it
    // binds no listeners and opens no connection until connect() is called.
    url: mongoConnectionService.buildUri(),

    databaseName: packageJson.name,

    options: {
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  // The migrations dir, can be an relative or absolute path
  migrationsDir: 'migrations',

  // The mongodb collection where the applied changes are stored
  changelogCollectionName: 'changelog',

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: '.js',

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  moduleSystem: 'commonjs',
};
