const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: { app: 'src/index' },
    devtool: "source-map",
    output: {
        publicPath: '/'
    },
    plugins:[
        new HtmlWebpackPlugin({
            template: 'index.html',
            chunks: ['app']
        })
    ]
}