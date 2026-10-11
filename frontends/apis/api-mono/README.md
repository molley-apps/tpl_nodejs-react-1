# generate-it-typescript-client-to-server

Used in conjunction with generate-it to output api clients for server to server or browser to server.

The template expects you to inject your own service called "HttpService" which it will then use to call your APIs.

All API path configuration is handled automatically through the `BaseApiService.configure()` method. 

## BaseApiService Configuration

All generated service classes extend `BaseApiService`, which provides centralized configuration for API endpoints. **You must configure the BaseApiService in your application before making any API calls**, otherwise the services will throw an error.

### How to Configure

Call `BaseApiService.configure()` once during your application initialization (e.g., in your main app entry point or root component):

```typescript
import { BaseApiService as YourApiBaseApiService } from './apis/your-api/services/BaseApiService';

// Configure on app startup
YourApiBaseApiService.configure({
  url: 'https://api.example.com',  // Your API server URL
  basePath: '/v1'                   // Your API base path
});
```

### Example: React Application

```typescript
// src/index.tsx or src/App.tsx
import { BaseApiService as YourApiBaseApiService } from '@/apis/your-api/services/BaseApiService';
import { config } from '@/config';

// Configure before rendering
YourApiBaseApiService.configure({
  url: config.api.url,
  basePath: config.api.basePath
});

// Now you can use any generated service
import UserService from '@/apis/api-mono/services/UserService';
const users = await UserService.getUsers();
```

### Example: Node.js Application

```typescript
// src/app.ts
import { BaseApiService as YourApiBaseApiService } from './apis/your-api/services/BaseApiService';

YourApiBaseApiService.configure({
  url: process.env.API_URL || 'http://localhost:3000',
  basePath: '/api/v1'
});

// Services are now ready to use
```

### Important Notes

- **Setup Check**: Each generated service method checks if `BaseApiService.configure()` has been called. If not, it throws an error: `"BaseApiService not configured. Call BaseApiService.configure() during app initialization."`
- **Call Once**: You only need to call `configure()` once during application startup
- **All Services Share Config**: All generated services inherit from `BaseApiService` and use the same configuration
- **Check Configuration**: You can verify if the service is configured using `BaseApiService.isConfigured()`

## How to Generate the APIs

Copy this script into your project and run it to generate the API client services:

```js

const apiNames = [
  'apiAuth',
  'apiNotifications'
];

const generateIt = require('../node_modules/generate-it/build/generateIt').default;
const generate = (configArray) => {
  if (configArray.length > 0) {
    const apiName = configArray.shift();
    const config = {
      swaggerFilePath: '../../' + apiName + '-spec/build/release.yml', // correct to your project setup, this assumes this file exists
      targetDir: './src/apis/' + apiName,
      template: 'https://github.com/johncarmichael-rgb/gen-tpl-client-api-consumers.git',
      // Inject dynamic content to the tpl here:
      variables: {
        httpServiceImport: '@/services/HttpService'
      },
      dontRunComparisonTool: true,
      dontUpdateTplCache: false,
      mockServer: false,
      segmentsCount: 1,
    };
    generateIt(config)
      .then(() => {
        console.log(`API generated for: ${apiName}`);
        generate(configArray);
      })
      .catch((e) => {
        console.log('API generation error: ', e);
      });
  }
};

generate(apiNames);


```
