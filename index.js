/**
 * @desc 替换html中静态资源的url
 */
'use strict';

let path = require('path');
let _ = require('lodash');

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
  urlTimestamp: false,
  // 配置url统一前缀，可用来编译cdn域名
  urlPrefix: undefined
};

/**
 * @constructor
 * @param  {Object} options 配置项
 */
let HtmlWebpackPluginReplaceurl = function(options) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
}

/**
 * @override
 * @param  {Object} compiler webpack compiler对象
 */
HtmlWebpackPluginReplaceurl.prototype.apply = function(compiler) {
    let _this = this;
    compiler.plugin('compilation', function(compilation) {
      compilation.plugin('html-webpack-plugin-before-html-processing', function(htmlPluginData,
        callback) {
        _this.replaceUrl(htmlPluginData, callback);
      });
    });
  }
  /**
   * @method
   * @desc 替换url函数
   * @param  {Object}   htmlPluginData           html数据
   * @param  {Function} callback                 回调函数
   * @return null
   */
HtmlWebpackPluginReplaceurl.prototype.replaceUrl = function(htmlPluginData, callback) {
  let _this = this;
  // js和css文件名匹配正则
  const REG_JS_FILENAME = new RegExp(_this.options.js.mainFilePrefix + '[\\.\\w+]+\\.js$');
  const REG_CSS_FILENAME = new RegExp(_this.options.style.mainFilePrefix + '[\\.\\w+]+\\.css$');
  // html内容文本
  let _html = htmlPluginData.html;
  // 静态资源汇总对象
  let _assets = htmlPluginData.assets;
  // 生成时间戳，false时为null
  let _urlTimestamp = _this.options.urlTimestamp && (new Date()).getTime() || null;
  // url前缀
  let _urlPrefix = _this.options.urlPrefix || false;

  // 替换js url
  for (let i = 0, len = _assets.js.length; i < len; i++) {
    let _jsFile = _assets.js[i];
    let _filename = _.last(_jsFile.split('/'));
    let _regJsSrc = null;
    if (REG_JS_FILENAME.test(_jsFile)) {
      let _originName = _this.options.js.useHash ? _filename.split(/[a-z\d]+\.js$/.exec(_filename))[
        0] + 'js' : _filename;
      _regJsSrc = new RegExp('src\\s?=\\s?(\'|\")' + '[\\.\\w\/]*' + _originName.split('.').join(
        '\\.') + '(\'|\")', 'g');
      let _targetName = '';
      _urlPrefix && (_targetName = _urlPrefix + _jsFile);
      _urlTimestamp && (_targetName += '?' + _urlTimestamp);
      _html = _html.replace(_regJsSrc, 'src = \"' + _targetName + '\"');
    }
  }
  // 替换css url
  for (let i = 0, len = _assets.css.length; i < len; i++) {
    let _cssFile = _assets.css[i];
    let _filename = _.last(_cssFile.split('/'));
    let _regCssSrc = null;
    if (REG_CSS_FILENAME.test(_cssFile)) {
      let _originName = _this.options.style.useHash ? _filename.split(/[a-z\d]+\.css$/.exec(
        _filename))[0] + 'css' : _filename;
      _regCssSrc = new RegExp('href\\s?=\\s?(\'|\")' + '[\.\\w\/]*' + _originName.split('.').join(
        '\\.') + '(\'|\")', 'g');
      let _targetName = '';
      _urlPrefix && (_targetName = _urlPrefix + _cssFile);
      _urlTimestamp && (_targetName += '?' + _urlTimestamp);
      _html = _html.replace(_regCssSrc, 'href = \"' + _targetName + '\"');
    }
  }
  // 插入vendor文件
  // @todo 目前需要手动在html中写入vendor文件，后续会研究如何自动插入
  if (_this.options.vendor && _assets.chunks.hasOwnProperty('vendor')) {
    let _regJsSrc = new RegExp('[\\.\\w\/]+' + _this.options.vendor.split('.').join('\\.'), 'g');
    _html = _html.replace(_regJsSrc, _assets.chunks.vendor.entry);
  }
  // 替换html内容文本
  htmlPluginData.html = _html;
  // 插件执行完毕之后必须执行回调函数，否则编译终止
  callback(null, htmlPluginData);
}

module.exports = HtmlWebpackPluginReplaceurl;
