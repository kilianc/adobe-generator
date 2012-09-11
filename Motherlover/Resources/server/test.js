// var photoshop = require('./lib/photoshop')

// var photoshop = photoshop()
// var switchDocument = ''
// switchDocument += 'var idslct = charIDToTypeID( "slct" );'
// switchDocument += 'var desc638 = new ActionDescriptor();'
// switchDocument += 'var idnull = charIDToTypeID( "null" );'
// switchDocument += 'var ref587 = new ActionReference();'
// switchDocument += 'var idDcmn = charIDToTypeID( "Dcmn" );'
// switchDocument += 'ref587.putOffset( idDcmn, 1 );'
// switchDocument += 'desc638.putReference( idnull, ref587 );'
// switchDocument += 'executeAction( idslct, desc638, DialogModes.NO );'
// switchDocument += '"switchDocument"'

// photoshop.connect('127.0.0.1', 49494, 'password', function () {
//   photoshop.subscribe('currentDocumentChanged')
//   photoshop.on('currentDocumentChanged', function (err, response) {
//     response = Number(response)
//     if (response !== 1124 && response !== 1166) {
//       throw new Error('FAIL')
//     }
//     photoshop.execute('app.version')
//   })
//   photoshop.execute(switchDocument)
//   photoshop.execute('"ok"', function (err, response) {
//     if (response.body !== 'ok') {
//       throw new Error('"' + response.body + '" !== "ok"')
//     }
//   })
//   setTimeout(function () {
//     console.log('PASS')
//     process.exit()
//   }, 3000)
// })
var mdns = require('mdns')

// mdns.browseThemAll().on('serviceUp', function(service) {
//   console.log("service up: %s", service.type.name, service.host, service.addresses);
// }).on('serviceDown', function(service) {
//   console.log("service down: ", service)
// }).start()

var browser = mdns.createBrowser(mdns.tcp('http'));

browser.on('serviceUp', function(service) {
  console.log("service up: ", service);
});
browser.on('serviceDown', function(service) {
  console.log("service down: ", service);
});

browser.start();

//   NSArray *openApps = [[NSWorkspace sharedWorkspace] runningApplications];
//   [openApps enumerateObjectsUsingBlock:^(NSRunningApplication *app, NSUInteger idx, BOOL *stop) {

//     NSString *appName = [app localizedName];

//     if ([appName isEqualToString:@"Photoshop"])
//     {
//       NSBundle *appBundle = [NSBundle bundleWithURL:[app bundleURL]];
//       NSString *appVersion = [[appBundle infoDictionary] objectForKey:@"Adobe Product Version"];
// //      NSArray *appSemVer = [appVersion componentsSeparatedByString:@"."];

//       if ([appVersion isEqualToString:@"13.0.0"])
//       {
//         appName = [NSString stringWithFormat:@"%@ %@", appName, @" CS6"];
//       }
//       else if ([appVersion isEqualToString:@"13.1.0"])
//       {
//         appName = [NSString stringWithFormat:@"%@ %@", appName, @" CS7"];
//       }

//       NSMenuItem *menuItem = [[NSMenuItem alloc] initWithTitle:appName action:@selector(selectPSVersion:) keyEquivalent:@""];
//       [statusBarMenu insertItem:menuItem atIndex:3];
//     }
//   }];
