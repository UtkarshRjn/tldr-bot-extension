const path = require('path');
const RefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        background: './background.js',
        content: './content.js',
        popup: './popup.js',
        options: './options.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    plugins: [
        new RefreshWebpackPlugin()
    ],
    watch: true
}; 