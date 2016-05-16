'use strict';
let fs = require('fs');
let path = require('path');

const DEFAULT_OPTIONS = {
    mainFilePrefix: {
        js: 'main',
        css: 'main'
    }
};

let HtmlWebpackReplaceurlPlugin = function(options) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
}

HtmlWebpackReplaceurlPlugin.prototype.apply = function(compiler) {
    let _this = this;
    compiler.plugin('compilation', function(compilation) {
        compilation.plugin('html-webpack-plugin-before-html-processing', function(htmlPluginData, callback) {
            _this.replaceUrl(compilation, htmlPluginData.plugin.options, htmlPluginData, callback);
        });
    });
}

HtmlWebpackReplaceurlPlugin.prototype.replaceUrl = function(compilation, htmlWebpackPluginOptions, htmlPluginData,
    callback) {
    let _this = this;
    const REG_JS_FILENAME = new RegExp(_this.options.mainFilePrefix.js + '\\.\\w+');
    const REG_CSS_FILENAME = new RegExp(_this.options.mainFilePrefix.css + '\\.\\w+');

    let _html = htmlPluginData.html;

    let _assets = htmlPluginData.assets;
    let _entries = compilation.compiler.options.entry;
    for (let i = 0, len = _assets.js.length; i < len; i++) {
        let jsFile = _assets.js[i];
        if (REG_JS_FILENAME.test(jsFile)) {
            let _srcFile = REG_JS_FILENAME.exec(jsFile) + '.js';
            _html = _html.replace(_srcFile, jsFile);
        }
    }
    for (let i = 0, len = _assets.css.length; i < len; i++) {
        let cssFile = _assets.css[i];
        if (REG_CSS_FILENAME.test(cssFile)) {
            let _srcFile = REG_CSS_FILENAME.exec(cssFile) + '.css';
            _html = _html.replace(_srcFile, cssFile);
        }
    }
    htmlPluginData.html = _html;

    callback(null, htmlPluginData);
}

module.exports = HtmlWebpackReplaceurlPlugin;
