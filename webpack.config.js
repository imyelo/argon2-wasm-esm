const path = require('path');

module.exports = {
    mode: 'production',
    entry: './webpack-demo/argon2-demo-webpack.js',
    output: {
        path: path.resolve(__dirname, 'webpack-demo/dist'),
        publicPath: 'webpack-demo/dist/',
        filename: 'bundle.js'
    },

    // node: {
    //     __dirname: false,
    //     fs: 'empty',
    //     Buffer: false,
    //     process: false
    // },
    // module: {
    //     noParse: /\.wasm$/,
    //     rules: [
    //         {
    //             test: /\.wasm$/,
    //             loaders: ['base64-loader'],
    //             type: 'javascript/auto'
    //         }
    //     ]
    // }

};
