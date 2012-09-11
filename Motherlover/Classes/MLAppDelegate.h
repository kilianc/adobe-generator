//
//  MLAppDelegate.h
//  Motherlover
//
//  Created by Kilian Ciuffolo on 8/30/12.
//  Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
//

@class SUUpdater;
@class KCNodeJS;

@interface MLAppDelegate : NSObject <NSApplicationDelegate, NSNetServiceBrowserDelegate, NSNetServiceDelegate, NSMenuDelegate, NSUserNotificationCenterDelegate>
{
	NSArray *crazyList;
	NSArray *crazyLinks;

	NSString *uuid;

	KCNodeJS *nodeProcess;
	NSString *scriptPath;
	NSNumber *httpPort;

	NSArray *localAdresses;
	NSThread *servicesBrowserThread;
	NSNetServiceBrowser *servicesBrowser;
	NSMutableArray *services;
	BOOL firstServiceScan;

	NSString *selectedServiceName;
	NSMenuItem *selectedServiceMenuItem;

	NSStatusItem* statusItem;
	IBOutlet NSMenu *statusBarMenu;
	IBOutlet NSMenuItem *statusMenuItem;
	IBOutlet NSMenuItem *launchBrowserMenuItem;

	IBOutlet NSWindow *promptPasswordWindow;
	IBOutlet SUUpdater *updater;

	IBOutlet NSTextField *passwordTextField;
	IBOutlet NSButton *connectButton;
	IBOutlet NSButton *crazyButton;
}

- (IBAction)savePasswordAndConnect:(id)sender;
- (IBAction)whatever:(id)sender;

@end
