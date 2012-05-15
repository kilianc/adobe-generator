;(function (exports) {
  "use strict";

  exports.toolsMap = {
    'arrow': 'moveTool',
    'marquee': 'marqueeRectTool',
    'lasso': 'lassoTool',
    'wand': 'magicWandTool',
    'crop': 'cropTool',
    'eyedropper': 'eyedropperTool',
    'heal': 'spotHealingBrushTool',
    'brush': 'paintbrushTool',
    'stamp': 'cloneStampTool',
    'eraser': 'eraserTool',
    'fill': 'bucketTool',
    'blur': 'blurTool',
    'dodge': 'dodgeTool',
    'type': 'typeCreateOrEditTool',
    'pen': 'penTool',
    'shape': 'ellipseTool'
  }

  exports.toolsMapReverse = {}
  Object.keys(toolsMap).forEach(function (toolId) {
    exports.toolsMapReverse[toolsMap[toolId]] = toolId
  })
})(window)