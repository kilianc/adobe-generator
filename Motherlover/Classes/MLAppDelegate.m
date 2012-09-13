//
//  MLAppDelegate.m
//  Motherlover
//
//  Created by Kilian Ciuffolo on 8/30/12.
//  Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
//

#import "MLAppDelegate.h"
#import "KCNodeJS.h"
#import "KCSystemInfo.h"
#import "SSKeyChain.h"
#import <Sparkle/Sparkle.h>

#include <arpa/inet.h>

@implementation MLAppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification
{
	crazyList = @[
		@{ @"label": @"Tonight", @"url": @"http://www.youtube.com/watch?v=Sv6dMFF_yts" },
		@{ @"label": @"Chuck", @"url": @"http://www.youtube.com/watch?v=sZz2yCe3pIg" },
		@{ @"label": @"Have you?", @"url": @"http://www.youtube.com/watch?v=J-Q4AkJ9iIU" },
		@{ @"label": @"The word", @"url": @"http://www.youtube.com/watch?v=2WNrx2jq184" },
		@{ @"label": @"Hey Girl", @"url": @"http://siliconvalleyryangosling.tumblr.com/" },
		@{ @"label": @"Whatever", @"url": @"http://assets0.ordienetworks.com/images/GifGuide/DealWithIt/bieberdealwithit.gif" },
		@{ @"label": @"Dayum", @"url": @"http://www.youtube.com/watch?v=DcJFdCmN98s" },
		@{ @"label": @"Call me Maybe", @"url": @"http://www.youtube.com/watch?v=dBM7i84BThE" },
		@{ @"label": @"Totally Cancelled", @"url": @"http://www.hulu.com/watch/34464" },
		@{ @"label": @"All the things", @"url": @"http://www.gamesprays.com/files/resource_media/preview/build-all-the-things-5638_preview.jpg" },
	];
	
	[updater checkForUpdatesInBackground];
	
	uuid = [JKSystemInfo UUID];
	
	services = [NSMutableArray array];
	servicesBrowser = [NSNetServiceBrowser new];
	[servicesBrowser setDelegate:self];
	
	[NSThread detachNewThreadSelector:@selector(lookupLocalAddress) toTarget:self withObject:nil];
	
	[[NSUserNotificationCenter defaultUserNotificationCenter] setDelegate:self];
	
	scriptPath = [NSString stringWithFormat:@"%@/%@", [[NSBundle mainBundle] resourcePath], @"server"];
	
	nodeProcess = [KCNodeJS process];
	[nodeProcess setDelegate:self];
	[nodeProcess launchScriptPath:scriptPath scriptName:@"server" andEnvironment:@{ @"DYLD_LIBRARY_PATH": @"dylib" }];
	
	statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSVariableStatusItemLength];
	[statusItem setImage:[NSImage imageNamed:@"statusbar"]];
	[statusItem.image setTemplate:YES];
	[statusItem setHighlightMode:YES];
	[statusItem setMenu:statusBarMenu];
	
	[launchBrowserMenuItem setEnabled:NO];
	[statusBarMenu setDelegate:self];
	[statusBarMenu setAutoenablesItems:NO];
}

- (void)lookupLocalAddress
{
	@synchronized(localAdresses)
	{
		localAdresses = [[NSHost currentHost] addresses];
		[servicesBrowser searchForServicesOfType:@"_photoshopserver._tcp." inDomain:@""];
	}
}

#pragma mark -
#pragma mark UI

- (void)menuWillOpen:(NSMenu *)menu
{
	[statusItem setImage:[NSImage imageNamed:@"statusbar"]];
}

- (void)connectToPhotoshop:(NSMenuItem *)sender
{
	NSDictionary *data = [sender representedObject];
	
	selectedServiceName = [data valueForKey:@"name"];
	selectedServiceMenuItem = sender;
	
	NSString *password = [SSKeychain passwordForService:selectedServiceName account:@"motherlover"];
	
	[nodeProcess sendMessage:@{
		@"name" : @"connect",
		@"host" : [data valueForKey:@"host"],
		@"port" : [data valueForKey:@"port"],
		@"password" : (password ? password : @"12345")
	}];
}

- (void)disconnectFromPhotoshop:(NSMenuItem *)sender
{
	[nodeProcess sendMessage:@{ @"name": @"disconnect" }];
}

- (IBAction)savePasswordAndConnect:(id)sender
{
	[SSKeychain setPassword:[passwordTextField stringValue] forService:selectedServiceName account:@"motherlover"];
	[self connectToPhotoshop:selectedServiceMenuItem];
	[promptPasswordWindow close];
}

- (IBAction)launchBrowser:(id)sender
{
	[[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:%d", [httpPort intValue]]]];
}

- (BOOL)userNotificationCenter:(NSUserNotificationCenter *)center shouldPresentNotification:(NSUserNotification *)notification
{
	return YES;
}

- (void)userNotificationCenter:(NSUserNotificationCenter *)center didActivateNotification:(NSUserNotification *)notification
{
	if ([notification activationType] != NSUserNotificationActivationTypeActionButtonClicked)
		return;
	
	NSDictionary *userInfo = [notification userInfo];
	
	[[statusBarMenu itemArray] enumerateObjectsUsingBlock:^(NSMenuItem *menuItem, NSUInteger idx, BOOL *stop) {
		if ([[menuItem.representedObject valueForKey:@"name"] isEqualToString:[userInfo valueForKey:@"name"]])
		{
			[self connectToPhotoshop:menuItem];
			*stop = YES;
		}
	}];
}

#pragma mark -
#pragma mark App Update

- (void)updater:(SUUpdater *)pUpdater didFindValidUpdate:(SUAppcastItem *)update
{
//  SUUpdateDriver *driver = [updater performSelector:@selector(driver)];
//  [driver automaticUpdateAlert:nil finishedWithChoice:SUInstallLaterChoice];
//  updater inst
//  updater
}

#pragma mark -
#pragma mark NodeJs process management

- (void)nodejsProcessDidLaunch:(KCNodeJS *)process
{
	[statusMenuItem setTitle:@"Status: Idle"];
}

- (void)nodejsProcessDidTerminate:(KCNodeJS *)process
{
	[statusMenuItem setTitle:@"Status: Not Running"];
}

- (void)nodejsProcess:(KCNodeJS *)process didSentMessage:(NSDictionary *)messgage
{
	NSLog(@"didSentMessage: %@", messgage);
	
	if ([@"connected" isEqualToString:[messgage objectForKey:@"name"]])
	{
		[launchBrowserMenuItem setEnabled:YES];
		[statusMenuItem setTitle:@"Status: Connected"];
		[selectedServiceMenuItem setState:NSOnState];
		[selectedServiceMenuItem setAction:@selector(disconnectFromPhotoshop:)];
		
		return;
	}
	
	if ([@"disconnected" isEqualToString:[messgage objectForKey:@"name"]])
	{
		[launchBrowserMenuItem setEnabled:NO];
		[statusMenuItem setTitle:@"Status: Idle"];
		
		[selectedServiceMenuItem setState:NSOffState];
		[selectedServiceMenuItem setAction:@selector(connectToPhotoshop:)];
		selectedServiceMenuItem = nil;
		selectedServiceName = nil;
		
		return;
	}
	
	if ([@"httpPort" isEqualToString:[messgage objectForKey:@"name"]])
	{
		httpPort = [messgage objectForKey:@"data"];
		
		return;
	}
}

- (void)nodejsProcess:(KCNodeJS *)process didSentError:(NSDictionary *)error
{
	NSLog(@"nodejs:didSentError: %@", [error objectForKey:@"code"]);
	
	if ([@"ECONNREFUSED" isEqualToString:[error objectForKey:@"code"]])
	{
		NSAlert *alert = [NSAlert new];
		[alert setIcon:[NSImage imageNamed:@""]];
		[alert addButtonWithTitle:@"OK"];
		[alert setMessageText:@"Connection Error"];
		[alert setInformativeText:[NSString stringWithFormat:@"The Photoshop Remote Connection (%@) seems to not be available at the moment.", selectedServiceName]];
		[alert setAlertStyle:NSWarningAlertStyle];
		[alert runModal];
		
		selectedServiceMenuItem = nil;
		selectedServiceName = nil;
		
		return;
	}
	
	if ([@[@"EPIPE", @"ECONNRESET", @"ETIMEOUT"] containsObject:[error objectForKey:@"code"]])
	{
		NSAlert *alert = [NSAlert new];
		[alert setIcon:[NSImage imageNamed:@""]];
		[alert addButtonWithTitle:@"Retry"];
		[alert setMessageText:@"Wrong Password"];
		[alert setInformativeText:@"The Photoshop Remote Connection password doesn't match the one you provided, please try again."];
		[alert setAlertStyle:NSWarningAlertStyle];
		[alert runModal];
		
		[selectedServiceMenuItem setState:NSOffState];
		
		int index = arc4random() % [crazyList count];
		NSDictionary *crazyItem = [crazyList objectAtIndex:index];
		
		[crazyButton setTitle:[crazyItem valueForKey:@"label"]];
		[crazyButton setAlternateTitle:[crazyItem valueForKey:@"url"]];
		
		[promptPasswordWindow center];
		[promptPasswordWindow makeKeyAndOrderFront:self];
		
		return;
	}
	
	if ([@"UNCAUGHT_EXCEPTION" isEqualToString:[error objectForKey:@"code"]])
	{
		// REPORTING
		return;
	}
	
	if ([@"ESCRIPTPSUPP" isEqualToString:[error objectForKey:@"code"]])
	{
		NSAlert *alert = [NSAlert new];
		[alert setIcon:[NSImage imageNamed:@""]];
		[alert addButtonWithTitle:@"OK"];
		[alert setMessageText:@"Connection Error"];
		[alert setInformativeText:[NSString stringWithFormat:@"The Photoshop Remote Connection (%@) seems to have an old ScriptingSupport plugin. Please update it and try again.", selectedServiceName]];
		[alert setAlertStyle:NSWarningAlertStyle];
		[alert runModal];
		
		selectedServiceMenuItem = nil;
		selectedServiceName = nil;
		
		return;
	}
}

- (void)nodejsProcess:(KCNodeJS *)process didThrowParseError:(NSString *)error withString:(NSString *)string
{
	
}

#pragma mark -
#pragma mark Net Service Browser Delegate Methods

- (void)netServiceBrowser:(NSNetServiceBrowser *)browser didFindService:(NSNetService *)service moreComing:(BOOL)more
{
	[services addObject:service];
	[service setDelegate:self];
	[service resolveWithTimeout:5.0];
}

- (void)netServiceDidResolveAddress:(NSNetService *)service
{
	NSString *address = [self getStringFromAddressData:[[service addresses] objectAtIndex:0]];
	NSMenuItem *menuItem = [NSMenuItem new];
	
	if ([localAdresses containsObject:address])
	{
		[menuItem setImage:[NSImage imageNamed:@"local"]];
	}
	else
	{
		[menuItem setImage:[NSImage imageNamed:@"network"]];
	}
	
	[menuItem.image setTemplate:YES];
	[menuItem setTitle:[service name]];
	[menuItem setAction:@selector(connectToPhotoshop:)];
	[menuItem setRepresentedObject:@{
		@"host": address,
		@"port": [NSNumber numberWithInteger:[service port]],
		@"name": [service name]
	}];
	
	if (![[statusBarMenu itemAtIndex:2] isEnabled])
	{
		[statusBarMenu removeItemAtIndex:2];
	}
	
	[statusBarMenu insertItem:menuItem atIndex:2];
	
	NSUserNotification *notification = [[NSUserNotification alloc] init];
	[notification setTitle:@"New Remote Connection"];
	[notification setInformativeText:[NSString stringWithFormat:@"\"%@\" is available for connections now.", [service name]]];
	[notification setUserInfo:menuItem.representedObject];
	
	[[NSUserNotificationCenter defaultUserNotificationCenter] scheduleNotification:notification];
	[[NSUserNotificationCenter defaultUserNotificationCenter] removeAllDeliveredNotifications];
	
	[statusItem setImage:[NSImage imageNamed:@"statusbar_notification"]];
}

- (NSString *)getStringFromAddressData:(NSData *)data
{
	struct sockaddr_in *socketAddress = (struct sockaddr_in *)[data bytes];
	return [NSString stringWithFormat: @"%s", inet_ntoa(socketAddress->sin_addr)];
}

- (void)netService:(NSNetService *)service didNotResolve:(NSDictionary *)errorDict
{
	NSLog(@"Could not resolve: %@", errorDict);
}

- (void)netServiceBrowser:(NSNetServiceBrowser *)serviceBrowser didRemoveService:(NSNetService *)removedService moreComing:(BOOL)moreComing
{
	[services filterUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(NSNetService *service, NSDictionary *bindings) {
		return ![[service name] isEqualToString:[removedService name]];
	}]];
	
	[[statusBarMenu itemArray] enumerateObjectsUsingBlock:^(NSMenuItem *menuItem, NSUInteger idx, BOOL *stop) {
		if ([[[menuItem representedObject] valueForKey:@"name"] isEqualToString:[removedService name]])
		{
			[statusBarMenu removeItem:menuItem];
		}
	}];
	
	if (![services count])
	{
		NSMenuItem *lookingUp = [NSMenuItem new];
		[lookingUp setTitle:@"Looking for connections..."];
		[lookingUp setEnabled:NO];
		[statusBarMenu insertItem:lookingUp atIndex:2];
	}
}

- (void)whatever:(NSButton *)sender
{
	[[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:[sender alternateTitle]]];
}

@end