var config = module.exports;

config['habahaba'] = {
    env: 'browser',
    rootPath: './',
    libs: [
        'libs/requirejs/require.js',
        'require-config-for-tests.js',
        'libs/log4javascript.js',
        'libs/crypto-js-read-only/build/components/core.js',
        'libs/crypto-js-read-only/build/components/enc-base64.js',
        'libs/crypto-js-read-only/build/components/md5.js',
        'libs/crypto-js-read-only/build/components/sha1.js'
    ],
    resources: [
        'libs/jquery.js',
        'libs/jslix/src/*.js',
        'libs/js-signals/dist/signals.js'
    ],
    sources: [
        'src/js/*.js'
    ],
    tests: ['tests/*.js'],
    extensions: [require('buster-amd')],
    'buster-amd': {
        pathMapper: function(path){
            return path.replace(/\.js$/, '').replace(/^\//, '../../');
        }
    }
};
