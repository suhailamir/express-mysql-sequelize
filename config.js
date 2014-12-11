var config = {};

// should end in /
config.rootUrl = process.env.ROOT_URL || 'http://localhost:4000/';

config.facebook = {
    appId: process.env.FACEBOOK_APPID || '728849273821011',
    appSecret: process.env.FACEBOOK_APPSECRET || 'f3b88644679fc3b45b93e16fba3ee6bf',
    appNamespace: process.env.FACEBOOK_APPNAMESPACE || 'Qlicfire',
    redirectUri: process.env.FACEBOOK_REDIRECTURI || config.rootUrl + 'login'
};

module.exports = config;
