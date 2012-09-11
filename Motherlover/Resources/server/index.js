module.exports = process.env.MOTHERLOVER_COV ? {
  photoshop: require('lib-cov/photoshop'),
  layerToPng: require('lib-cov/layer_to_png')
} : {
  photoshop: require('lib/photoshop'),
  layerToPng: require('lib/layer_to_png')
}