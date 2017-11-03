'use strict';

const _ = require('lodash');
const Path = require('path');
const Parser5 = require('parse5');

const DEFAULT_OPTIONS = {
  // 解析模式：strict-严格模式；loose-宽松模式
  mode: 'strict',
  js: {
    // 文件名前缀，用来正则匹配待替换文件名
    mainFilePrefix: 'main',
    // 代替换文件名是否包含hash指纹
    useHash: false,
    separator: '.',
    common: true,
  },
  css: {
    mainFilePrefix: 'main',
    useHash: false,
    separator: '.'
  },
  // 是否在url末尾加入时间戳，默认false
  urlTimestamp: false
};

function ParseHtmlContent(html) {
  let styleNodes = [];
  let scriptNodes = [];
  const Document = Parser5.parse(html);

  if (Document.childNodes[1].tagName !== 'html') {
    throw new Error("Html document is invalid");
    process.exit();
  }

  const HtmlNode = Document.childNodes[1];
  let headNode = null;
  let bodyNode = null;
  HtmlNode.childNodes.forEach((node, index) => {
    if (node.tagName === 'body') {
      bodyNode = {
        node,
        index
      };
    } else if (node.tagName === 'head') {
      headNode = {
        node,
        index
      };
    }
  });

  if (!bodyNode || !headNode) {
    throw new Error("Html document is invalid");
    process.exit();
  }
  bodyNode.node.childNodes.forEach((node, index) => {
    let tagName = node.tagName;
    let attrs = node.attrs;
    if (tagName === 'script') {
      scriptNodes.push({
        index,
        node,
        src: 'body'
      });
    } else if (tagName === 'link') {
      let attrRel = attrs.filter(attr => {
        return attr.name === 'rel' && attr.value === 'stylesheet';
      });
      if (attrRel.length !== 0) {
        styleNodes.push({
          index,
          node,
          src: 'body'
        });
      }
    }
  });
  headNode.node.childNodes.forEach((node, index) => {
    let tagName = node.tagName;
    let attrs = node.attrs;
    if (tagName === 'script') {
      scriptNodes.push({
        index,
        node,
        src: 'head'
      });
    } else if (tagName === 'link') {
      let attrRel = attrs.filter(attr => {
        return attr.name === 'rel' && attr.value === 'stylesheet';
      });
      if (attrRel.length !== 0) {
        styleNodes.push({
          index,
          node,
          src: 'head'
        });
      }
    }
  });
  return {
    styleNodes,
    scriptNodes,
    headNode,
    bodyNode,
    root: Document
  };
}

function SerializeHtmlContent(nodeTree) {
  let html = nodeTree.root.childNodes[1];
  let bodyNodes = nodeTree.body;
  let headNodes = nodeTree.head;
  nodeTree.styles.concat(nodeTree.scripts).forEach(node => {
    if (node.src === 'head') {
      headNodes.node[node.index] = node.node;
    } else if (node.src === 'body') {
      bodyNodes.node[node.index] = node.node;
    }
  });

  html.childNodes[bodyNodes.index] = bodyNodes.node;
  html.childNodes[headNodes.index] = headNodes.node;
  nodeTree.root.childNodes[1] = html;
  return Parser5.serialize(nodeTree.root);
}

/**
 * @constructor
 * @param  {Object} options 配置项
 */
let HtmlWebpackPluginReplaceurl = function (options) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
}

/**
 * @override
 * @param  {Object} compiler webpack compiler对象
 */
HtmlWebpackPluginReplaceurl.prototype.apply = function (compiler) {
    let self = this;
    compiler.plugin('compilation', function (compilation) {
      compilation.plugin('html-webpack-plugin-before-html-processing',
        function (htmlPluginData, callback) {
          if (self.options.mode === 'strict') {
            self.replaceUrlStrict(htmlPluginData, callback);
          } else {
            self.replaceUrlLoose(htmlPluginData, callback);
          }
        });
    });
  }
  /**
   * @method
   * @desc 替换资源地址-宽松模式
   * @param  {Object}   htmlPluginData           html数据
   * @param  {Function} callback                 回调函数
   * @return null
   */
HtmlWebpackPluginReplaceurl.prototype.replaceUrlLoose = function (
  htmlPluginData, callback) {
  let self = this;
  // js和css文件名匹配正则
  const REG_JS_FILENAME = new RegExp(
    `(${self.options.js.mainFilePrefix}|common)[\\.\\-\\w+]+\\.js$`);
  const REG_CSS_FILENAME = new RegExp(self.options.css.mainFilePrefix +
    '[\\.\\-\\w+]+\\.css$');
  // html内容文本
  let htmlContent = htmlPluginData.html;

  // 静态资源汇总对象
  let assets = htmlPluginData.assets;
  // 生成时间戳，false时为null
  let urlTimestamp = self.options.urlTimestamp && (new Date()).getTime() ||
    null;

  // 插入common文件
  // @todo 目前需要手动在html中写入common文件，后续会研究如何自动插入
  if (self.options.js.common && assets.chunks.hasOwnProperty('common')) {
    assets.js.push(assets.chunks.common.entry);
  }
  // 替换Script标签的src url
  assets.js.forEach(file => {
    let targetName = Path.basename(file, '.js');
    if (REG_JS_FILENAME.test(file)) {
      let originName = !self.options.js.useHash ? targetName :
        _.dropRight(targetName.split(self.options.js.separator)).join(
          self.options.js.separator);
      const RegJsSrc = new RegExp(
        `src\\s*=\\s*(\'|\")[\\.\\w\/]*${originName}\\.js(\'|\")`, 'g');
      urlTimestamp && (file += `?t=${urlTimestamp}`);
      htmlContent = htmlContent.replace(RegJsSrc, `src=\"${file}\"`);
    }
  });

  // 替换link标签的href url
  assets.css.forEach(file => {
    let targetName = Path.basename(file, '.css');
    if (REG_CSS_FILENAME.test(file)) {
      let originName = !self.options.css.useHash ? targetName :
        _.dropRight(targetName.split(self.options.css.separator)).join(
          self.options.css.separator);
      const RegCssSrc = new RegExp(
        `href\\s*=\\s*(\'|\")[\\.\\w\/]*${originName}\\.css(\'|\")`,
        'g');
      urlTimestamp && (file += `?t=${urlTimestamp}`);
      htmlContent = htmlContent.replace(RegCssSrc, `href=\"${file}\"`);
    }
  });

  // 替换html内容文本
  htmlPluginData.html = htmlContent;
  // 插件执行完毕之后必须执行回调函数，否则编译终止
  callback(null, htmlPluginData);
}

/**
 * @method
 * @desc 替换资源地址-严格模式
 * @param  {Object}   htmlPluginData           html数据
 * @param  {Function} callback                 回调函数
 * @return null
 */
HtmlWebpackPluginReplaceurl.prototype.replaceUrlStrict = function (
  htmlPluginData, callback) {
  const HtmlContent = htmlPluginData.html;
  const ParsedHtmlContent = ParseHtmlContent(HtmlContent);
  const ScriptNodes = ParsedHtmlContent.scriptNodes;

  const StyleNodes = ParsedHtmlContent.styleNodes;
  // 静态资源汇总对象
  const Assets = Object.assign({}, htmlPluginData.assets);
  const AssetsJS = Assets.js;
  const AssetsCSS = Assets.css;

  if (this.options.js.common && Assets.chunks.hasOwnProperty('common')) {
    AssetsJS.push(Assets.chunks.common.entry);
  }

  // 生成时间戳，false时为null
  const UrlTimestamp = this.options.urlTimestamp && (new Date()).getTime() ||
    null;

  let targetScriptNodes = [];

  while (ScriptNodes.length > 0 && AssetsJS.length > 0) {
    let targetUrl = AssetsJS[0];
    let targetName = Path.basename(targetUrl, '.js');
    let originName = !this.options.js.useHash ? targetName :
      _.dropRight(targetName.split(this.options.js.separator)).join(this.options
        .js.separator);
    for (let i = 0, len = ScriptNodes.length; i < len; i++) {
      let attrs = ScriptNodes[i] && ScriptNodes[i].node && [...ScriptNodes[i]
        .node.attrs] || [];
      let isMatch = false;

      if (attrs.length > 0) {
        ScriptNodes[i].node.attrs = attrs.map(attr => {
          if (attr && attr.name === 'src' && Path.basename(attr.value,
              '.js') === originName) {
            attr.value = targetUrl;
            isMatch = true;
          }
          return attr;
        });
        if (isMatch) {
          targetScriptNodes.push(ScriptNodes[i]);
          ScriptNodes.splice(i, 1);
        }
      }
    }
    AssetsJS.shift();
  }

  let targetStyleNodes = [];

  while (StyleNodes.length > 0 && AssetsCSS.length > 0) {
    let targetUrl = AssetsCSS[0];
    let targetName = Path.basename(targetUrl, '.css');
    let originName = '';
    if (!this.options.js.useHash) {
      originName = targetName;
    } else {
      let targetNameArr = targetName.split(this.options.css.separator);
      targetNameArr.pop();
      originName = targetNameArr.join(this.options.css.separator);
    }

    for (let i = 0, len = StyleNodes.length; i < len; i++) {
      let attrs = StyleNodes[i] && StyleNodes[i].node && [...StyleNodes[i].node
        .attrs] || [];
      let isMatch = false;
      if (attrs.length > 0) {
        StyleNodes[i].node.attrs = attrs.map(attr => {
          if (attr && attr.name === 'href' && Path.basename(attr.value,
              '.css') === originName) {
            attr.value = targetUrl;
            isMatch = true;
          }
          return attr;
        });
        if (isMatch) {
          targetStyleNodes.push(StyleNodes[i]);
          StyleNodes.splice(i, 1);
        }
      }
    }
    AssetsCSS.shift();
  }

  htmlPluginData.html = SerializeHtmlContent({
    root: ParsedHtmlContent.root,
    head: ParsedHtmlContent.headNode,
    body: ParsedHtmlContent.bodyNode,
    styles: targetStyleNodes,
    scripts: targetScriptNodes
  });

  callback(null, htmlPluginData);
};

module.exports = HtmlWebpackPluginReplaceurl;
