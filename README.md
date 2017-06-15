Html Webpack Replaceurl Plugin
==============================

此插件需配合[html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin)使用，作用是将html文档中对本地静态资源（js/style）的引用替换为经webpack编译后url。

### 安装

```
npm install html-webpack-replaceurl-plugin --save-dev
```

### 使用方法

配置webpack:

```javascript
let HtmlWebpackPlugin = require('html-webpack-plugin');
let HtmlWebpackReplaceurlPlugin = require('html-webpack-replaceurl-plugin');
let webpackConfig = {
  entry: {
      'main.a':'main.a.js',
      'vendor': 'vue'
  },
  output: {
    path: 'dist',
    publicPath: '/',
    filename: '[name].[hash].js'
  },
  plugins: [
      new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          filename: 'vendor.js'
      }),
      new HtmlWebpackPlugin({
          inject: false, //此项必须配置为false
      }),
      new HtmlWebpackReplaceurlPlugin({
        // 解析模式：strict-严格模式；loose-宽松模式
        mode: 'loose',
        js: {
          // 文件名前缀
          mainFilePrefix: 'main',
          // 代替换文件名是否包含hash指纹
          useHash: false,
          // 文件名分隔符，默认文件名规范为main.[name].js
          separator: '.',
          // 是否存在common模块
          common: true,
        },
        css: {
          // 文件名前缀
          mainFilePrefix: 'main',
          // 是否使用hash
          useHash: false,
          // 文件名分隔符，默认文件名规范为main.[name].css
          separator: '.'
        },
        // 是否在url末尾加入时间戳，默认false
        urlTimestamp: false
      })]
};
```

上述配置项应用于index.html文件：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
    <script src="vendor.js"></script>
  </head>
  <body>
    <script src="main.a.js"></script>
  </body>
</html>
```

编译后的index.html内容为：

```html
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
    <script src="/dist/vendor.js"></script>
  </head>
  <body>
    <script src="/dist/main.a.bc2e63dd.js"></script>
  </body>
</html>
```

### 模式选择
* `loose`-宽松模式，使用正则匹配，准确度略低；
* `strict`-严格模式，解析html文档100%匹配准确度。

详细原理请参考[boi-资源定位](https://boijs.github.io/docs/#/_multipage-location)。
