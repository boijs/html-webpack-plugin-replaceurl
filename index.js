/**
 * @desc 替换html中静态资源的url
 */
'use strict';

let fs = require('fs');
let path = require('path');

/**
 * @desc 默认配置
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
  js: {
    // 文件名前缀，用来正则匹配待替换文件名
    mainFilePrefix: 'main',
    // 代替换文件名是否包含hash指纹
    useHash: false
  },
  style: {
    mainFilePrefix: 'main',
    useHash: false
  },
  vendor: 'vendor.js',
  // 是否在url末尾加入时间戳，默认false
  urlTimestamp: false
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
  const REG_JS_FILENAME = new RegExp(_this.options.js.mainFilePrefix + '[\\.\\w+]+\\.js');
  const REG_CSS_FILENAME = new RegExp(_this.options.style.mainFilePrefix + '[\\.\\w+]+\\.css');

  let _html = htmlPluginData.html;
  let _assets = htmlPluginData.assets;

  // 生成时间戳，false时为null
  let urlTimestamp = _this.options.urlTimestamp && (new Date()).getTime() || null;

  // 替换js url
  for (let i = 0, len = _assets.js.length; i < len; i++) {
    let jsFile = _assets.js[i];
    let _arr = jsFile.split('/');
    let _filename = _arr[_arr.length - 1];
    let _regJsSrc = null;
    if (REG_JS_FILENAME.test(jsFile)) {
      let _originName = _this.options.js.useHash ? _filename.split(/[a-z\d]+\.js$/.exec(_filename))[0] + 'js' : _filename;
      _regJsSrc = new RegExp('src\\s?=\\s?(\'|\")' + '[\\.\\w\/]*' + _originName.split('.').join('\\.') + '(\'|\")', 'g');
      _html = _html.replace(_regJsSrc, 'src = \"' + (urlTimestamp ? jsFile + '?' + urlTimestamp : jsFile) + '\"');
    }
  }
  // 替换css url
  for (let i = 0, len = _assets.css.length; i < len; i++) {
    let cssFile = _assets.css[i];
    let _arr = cssFile.split('/');
    let _filename = _arr[_arr.length - 1];
    let _regCssSrc = null;
    if (REG_CSS_FILENAME.test(cssFile)) {
      let _originName = _this.options.style.useHash ? _filename.split(/[a-z\d]+\.css$/.exec(_filename))[0] + 'css' : _filename;
      _regCssSrc = new RegExp('href\\s?=\\s?(\'|\")' + '[\.\\w\/]*' + _originName.split('.').join('\\.') + '(\'|\")', 'g');
      _html = _html.replace(_regCssSrc, 'href = \"' + (urlTimestamp ? cssFile + '?' + urlTimestamp : cssFile) + '\"');
    }
  }
  // 插入vendor文件
  // @todo 目前需要手动在html中写入vendor文件，后续会研究如何自动插入
  if (_this.options.vendor && _assets.chunks.hasOwnProperty('vendor')) {
    let _regJsSrc = new RegExp('[\.\w\/]+' + _this.options.vendor.split('.').join('\\.'), 'g');
    _html = _html.replace(_regJsSrc, _assets.chunks.vendor.entry);
  }
  htmlPluginData.html = _html;

  callback(null, htmlPluginData);
}

module.exports = HtmlWebpackReplaceurlPlugin;
