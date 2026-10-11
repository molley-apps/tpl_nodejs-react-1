const config = [
  {
    from: 'api-mono',
  }
];

const generateIt = require('./node_modules/generate-it/build/generateIt').default;

const generate = (configArray) => {
  if (configArray.length === 0) {
    console.log('', '', 'Completed the generate of all apis.'.blue.bold);
  } else {
    const item = configArray.shift();
    generateIt({
      dontRunComparisonTool: true,
      dontUpdateTplCache: false,
      mockServer: false,
      segmentsCount: 1,
      swaggerFilePath: '../../apis/' + item.from + '/api-spec/release/api-spec.yml',
      targetDir: './' + item.from,
      template: 'https://github.com/johncarmichael-rgb/gen-tpl-client-api-consumers.git',
      variables: { httpServiceImport: 'services/src/HttpService', },
    })
      .then(() => console.log(`API generated: ${item.from}`) && generate(configArray))
      .catch((e) => console.log('API generation error: ', e));
  }
};

generate(config);
