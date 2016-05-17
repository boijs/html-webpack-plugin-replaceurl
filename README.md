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
          mainFilePrefix: {
              js: 'main',
              css: 'main'
          },
          vendor: 'vendor.js'
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

### 详细配置

-	`mainFilePrefix`:js/style文件的命名前缀，以此前缀匹配html文档中的文件引用。默认都是`main`；
-	`vendor`:是否需要匹配vendor文件，如果为false，则不匹配html文档中的vendor文件。默认匹配`vendor.js`。
