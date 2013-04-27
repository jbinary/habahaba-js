var config = module.exports;

config['habahaba'] = {
    env: 'browser',
    rootPath: './',
    libs: [
        'libs/jquery.js'
    ],
    sources: [
        'src/js/DOM-diff.js',
        'src/js/main.js'
    ],
    tests: ['tests/*.js']
};
