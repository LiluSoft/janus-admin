const path = require('path');

module.exports = {
    entry: {
        "videoroom":path.join(__dirname, '/videoroom.ts'),
        "admin": path.join(__dirname, '/admin.ts'),
    },
    //devtool: 'inline-source-map',
    output: {
        filename: '[name].js',
        path: path.join(__dirname, "js/"),
        sourceMapFilename: '[name].js.map',
        devtoolLineToLine: true,
        publicPath: path.join(__dirname),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' }
                ]
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    externals: {
        // require("jquery") is external and available
        //  on the global var jQuery
        "jquery": "jQuery",
        "toastr":"toastr",
        "bootbox":"bootbox",
        "spin":"Spinner",
        "superagent":"superagent",
        "webrtc-adapter":"adapter",
        //"jquery.blockui":"blockui",
        "bootstrap":"jQuery"
    },
    devServer: {
        contentBase: path.join(__dirname),
        publicPath: path.join(__dirname),
        clientLogLevel: 'trace',
        compress: true,
        writeToDisk: true
    }
};