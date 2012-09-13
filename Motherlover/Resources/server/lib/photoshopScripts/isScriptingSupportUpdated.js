var minimumBuildDate = new Date('Aug  8 2012 13:48:46')
var currentBuildDate = new Date(app.scriptingBuildDate)

// returning value
JSON.stringify(minimumBuildDate <= currentBuildDate)