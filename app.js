
// if (process.env.NODE_ENV !== 'production') {
//   const webpack = require('webpack')
//   const WebpackDevServer = require('webpack-dev-server')
//   const config = require('./webpack.config')
//   new WebpackDevServer(webpack(config), {
//     publicPath: config.output.publicPath,
//     hot: true
//   }).listen(3000, '127.0.0.1', function (err) {
//     if (err) {
//       console.log(err);
//     }
//     console.log('Listening at localhost:3000');
//   });
// } else {
  const path = require('path')
  const express = require('express')
  const port = (process.env.PORT || 3000)

  const app = express()
  const indexPath = path.join(__dirname, '/index.html')
  app.use(express.static('./'))
  app.get('/', function (_, res) {
    res.sendFile(indexPath)
  })
  app.get('/:id', function(_, res) {
    res.sendFile(indexPath)
  })
  app.listen(port)
  console.log(`Listening at http://localhost:${port}`)
// }

