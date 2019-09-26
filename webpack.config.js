const path = require('path');

module.exports = {
    mode: 'production',
    entry: './webpack-demo/argon2-demo-webpack.js',
    output: {
        path: path.resolve(__dirname, 'webpack-demo/dist'),
        publicPath: 'webpack-demo/dist/',
        filename: 'bundle.js'
    }
};
