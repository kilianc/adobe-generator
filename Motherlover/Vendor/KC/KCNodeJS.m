//
//  KCNodeJS.m
//  KCKit
//
//  Created by Kilian Ciuffolo on 9/5/12.
//  Copyright (c) 2012 RelaxedBit™. All rights reserved.
//

#import "KCNodeJS.h"
#import "MFTask.h"
#import <SBJson/SBJson.h>

@implementation KCNodeJS

@synthesize delegate;

+ (KCNodeJS *)process
{
	return [[KCNodeJS alloc] init];
}

- (id)init
{
	if(self = [super init])
	{
		nodePath = [[NSBundle mainBundle] pathForAuxiliaryExecutable:@"node"];

		jsonAdapter = [[SBJsonStreamParserAdapter alloc] init];
		[jsonAdapter setDelegate:self];
		
		jsonParser = [[SBJsonStreamParser alloc] init];
		[jsonParser setDelegate:jsonAdapter];
		[jsonParser setSupportMultipleDocuments:YES];
	}
	
	return self;
}

- (void)launchScriptPath:(NSString *)scriptPath scriptName:(NSString *)scriptName andEnvironment:(NSDictionary *)env;
{
	processStdInPipe = [NSPipe pipe];
	processStdIn = [processStdInPipe fileHandleForWriting];
	
	process = [[MFTask alloc] init];
	[process setStandardInput:processStdInPipe];
	[process setEnvironment:env];
	[process setLaunchPath:nodePath];
	[process setCurrentDirectoryPath:scriptPath];
	[process setArguments:[NSArray arrayWithObjects:scriptName, nil]];
	[process setDelegate:self];
	[process launch];
}

- (void)taskDidLaunch:(MFTask *)task
{
	keepAliveTimer = [NSTimer timerWithTimeInterval:1.0 target:self selector:@selector(keepAlive) userInfo:nil repeats:YES];
	[[NSRunLoop mainRunLoop] addTimer:keepAliveTimer forMode:NSRunLoopCommonModes];

	if ([delegate respondsToSelector:@selector(nodejsProcessDidLaunch:)])
	{
		[delegate nodejsProcessDidLaunch:self];
	}
}

- (void)keepAlive
{
	[self sendMessage:@{ @"name": @"ping" }];
}

- (void)taskDidTerminate:(MFTask *)task
{
	[keepAliveTimer invalidate];

	if ([delegate respondsToSelector:@selector(nodejsProcessDidTerminate:)])
	{
		[delegate nodejsProcessDidTerminate:self];
	}
}

- (void)taskDidRecieveInvalidate:(MFTask *)task
{
	
}

#pragma mark -
#pragma mark OUT

- (void)sendMessage:(NSDictionary *)message
{
	if ([process isRunning])
	{
		[processStdIn writeData:[[message JSONRepresentation] dataUsingEncoding:NSUTF8StringEncoding]];
		[processStdIn writeData:[@"\n" dataUsingEncoding:NSUTF8StringEncoding]];
	}
	else
	{
		[NSException raise:@"unexpected" format:@"Cannot sendMessage to a non running process"];
	}
}

#pragma mark -
#pragma mark IN

- (void)taskDidRecieveErrorData:(NSData*)data fromTask:(MFTask*)task
{
	NSLog(@"STDERR: %@", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
}

- (void)taskDidRecieveData:(NSData *)data fromTask:(MFTask *)task
{
	if ([jsonParser parse:data] == SBJsonStreamParserError)
	{
		NSString *string = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
		[delegate nodejsProcess:self didThrowParseError:jsonParser.error withString:string];
		
	}
//	NSLog(@"taskDidRecieveData %@", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);	
}

- (void)parser:(SBJsonStreamParser *)parser foundArray:(NSArray *)array
{
    [NSException raise:@"unexpected" format:@"Should not get here"];
}

- (void)parser:(SBJsonStreamParser *)parser foundObject:(NSDictionary *)object
{
	if ([@"error" isEqualToString:[object objectForKey:@"name"]])
	{
		if ([delegate respondsToSelector:@selector(nodejsProcess:didSentError:)])
		{
			[delegate nodejsProcess:self didSentError:[object valueForKey:@"data"]];
		}
	}
	else
	{
		if ([delegate respondsToSelector:@selector(nodejsProcess:didSentMessage:)])
		{
			[delegate nodejsProcess:self didSentMessage:object];
		}
	}
}

@end
