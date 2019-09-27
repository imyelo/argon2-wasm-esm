const path = require('path');

module.exports = {
    mode: 'production',
    entry: './test/webpack/argon2-demo.js',
    output: {
        path: path.resolve(__dirname, './test/webpack//dist'),
        publicPath: './test/webpack/dist/',
        filename: 'bundle.js'
    }
};
