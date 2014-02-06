require.config({
    baseUrl: 'js',
    paths: {
        'jslix': 'libs/jslix',
        'libs': 'libs',
        'cryptojs': 'libs/cryptojs/components',
        'contextmenu': 'libs/jQuery-contextmenu'
    },
    shim: {
        'libs/log4javascript': {
            exports: 'log4javascript'
        },
        'libs/jquery': {
            exports: '$'
        },
        'contextmenu/jquery.contextMenu': ['libs/jquery'],
        'contextmenu/jquery.ui.position': ['contextmenu/jquery.contextMenu'],
        'libs/jquery.transit': ['libs/jquery'],
        'libs/jquery.fullscreen': ['libs/jquery'],
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
