module.exports = {
  env: {
    NODE_ENV: '"production"',
  },
  defineConstants: {
    API_HOST: '"https://www.tciwms.com:8080"',
    TOKEN_APPKEY: '"698fedc1-f023-47d8-a851-0a14c53b1d79"',
    TOKEN_APPSECRET: '"27284B0ECA02-9918-4A12-AEAA-C9253FAC30B2-LVKZX"',
    TOKEN_GRANT_TYPE: '"client_credential"',
    REQUEST_SIGNATURE_FIXEDVALUE: '"LVKZX27284LVKZXHTTVYOUPEQVDG8E"',
  },
  mini: {},
  h5: {
    /**
     * 如果h5端编译后体积过大，可以使用webpack-bundle-analyzer插件对打包体积进行分析。
     * 参考代码如下：
     * webpackChain (chain) {
     *   chain.plugin('analyzer')
     *     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
     * }
     */
  }
}
