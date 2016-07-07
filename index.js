/**
 * 替换html中静态资源的url
 */
'use strict';
let fs = require('fs');
let path = require('path');
let _ = require('lodash');
// 默认配置
// mainFilePrefix: 文件名前缀，用来正则匹配待替换文件名
// vendor：如果需要插入vendor文件请务必配置此项，value是需插入的文件名，与webpack配置保持一致
const DEFAULT_OPTIONS = {
    mainFilePrefix: {
        js: 'main',
        css: 'main'
    },
    vendor: 'vendor.js'
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
    const REG_JS_FILENAME = new RegExp(_this.options.mainFilePrefix.js + '[\\.\\w-]+\\.js');
    const REG_CSS_FILENAME = new RegExp(_this.options.mainFilePrefix.css + '[\\.\\w-]+\\.css');

    let _html = htmlPluginData.html;
    let _assets = htmlPluginData.assets;
    let _chunks = Object.keys(_assets.chunks);

    // 替换js url
    for (let i = 0, len = _assets.js.length; i < len; i++) {
        let jsFile = _assets.js[i];
        let _filename = _.takeRight(jsFile.split('/'))[0];
        let _regJsSrc = null;
        if (REG_JS_FILENAME.test(jsFile)) {
            let _originName = '';
            if(_.indexOf(_chunks,_filename.split(/\.js$/)[0]) !== -1){
                _originName = _filename;
            }else{
                _originName = _filename.split(/\.[a-z0-9]+\.js$/.exec(_filename))[0] + '.js';
            }
            _regJsSrc = new RegExp('src\\s?=\\s?(\'|\")'+'[\.A-Za-z0-9_\/]*' + _originName.split('.').join('\\.')+'(\'|\")', 'g');
        }

        _html = _html.replace(_regJsSrc, 'src = \"'+jsFile+'\"');
    }
    // 替换css url
    for (let i = 0, len = _assets.css.length; i < len; i++) {
        let cssFile = _assets.css[i];
        let _filename = _.takeRight(cssFile.split('/'))[0];
        let _regCssSrc = null;
        if (REG_CSS_FILENAME.test(cssFile)) {
            let _originName = '';
            if(_.indexOf(_chunks,_filename.split(/\.css$/)[0]) !== -1){
                _originName = _filename;
            }else{
                _originName = _filename.split(/\.[a-z0-9]+\.css$/.exec(_filename))[0] + '.css';
            }
            _regCssSrc = new RegExp('href\\s?=\\s?(\'|\")'+'[\.A-Za-z0-9_\/]*' + _originName.split('.').join('\\.')+'(\'|\")', 'g');
        } else {
            _regCssSrc = new RegExp('href\\s?=\\s?(\'|\")'+'[\.A-Za-z0-9_\/]*' + _filename.split('.').join('\\.')+'(\'|\")', 'g');
        }
        _html = _html.replace(_regCssSrc, 'href = \"'+cssFile+'\"');
    }
    // 插入vendor文件
    // @todo 目前需要手动在html中写入vendor文件，后续会研究如何自动插入
    if (_this.options.vendor && _assets.chunks.hasOwnProperty('vendor')) {
        let _regJsSrc = new RegExp('[\.A-Za-z0-9_\/]+' + _this.options.vendor.split('.').join('\\.'), 'g');
        _html = _html.replace(_regJsSrc, _assets.chunks.vendor.entry);
    }
    htmlPluginData.html = _html;

    callback(null, htmlPluginData);
}

module.exports = HtmlWebpackReplaceurlPlugin;
