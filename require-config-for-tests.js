require.config({
    baseUrl: 'src/js',
    paths: {
        'libs': '../../libs',
        'libs/signals': '../../libs/js-signals/dist/signals',
        'jslix': '../../libs/jslix/src',
        'cryptojs': '../../libs/crypto-js-read-only/build/components',
        'contextmenu': '../../libs/jQuery-contextmenu/src'
    },
    shim: {
        'libs/jquery': {
            exports: '$'
        },
        'libs/log4javascript': {
            exports: 'log4javascript'
        },
        'contextmenu/jquery.contextMenu': ['libs/jquery'],
        'contextmenu/jquery.ui.position': ['contextmenu/jquery.contextMenu'],
        'libs/jquery.transit': ['libs/jquery'],
        'cryptojs/core': {
            exports: 'CryptoJS'
        },
        'cryptojs/md5': {
            deps: ['cryptojs/core'],
            exports: 'CryptoJS.MD5'
        },
        'cryptojs/sha1': {
            deps: ['cryptojs/core'],
            exports: 'CryptoJS.SHA1'
        },
        'cryptojs/enc-base64': {
            deps: ['cryptojs/core'],
            exports: 'CryptoJS.enc.Base64'
        }
    }
});
