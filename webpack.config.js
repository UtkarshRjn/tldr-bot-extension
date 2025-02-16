const path = require('path');
const RefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        background: './src/background.js',
        content: './src/content.js',
        popup: './src/popup.js',
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