module.exports = {
  entry: {
    index : './public/javascripts/index.js'
  },
  output: {
    path: __dirname + '/public/javascripts/bundle',
    filename: '[name].bundle.js'
  }
};
