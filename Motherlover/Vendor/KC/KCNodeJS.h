//
//  KCNodeJS.h
//  KCKit
//
//  Created by Kilian Ciuffolo on 9/5/12.
//  Copyright (c) 2012 RelaxedBit™. All rights reserved.
//

#include "MFTaskDelegateProtocol.h"
#include <SBJson/SBJson.h>

@class MFTask;
@class KCNodeJS;

@interface NSObject(KCNodeJS)
- (void)nodejsProcessDidLaunch:(KCNodeJS *)process;
- (void)nodejsProcessDidTerminate:(KCNodeJS *)process;
- (void)nodejsProcess:(KCNodeJS *)process didSentError:(NSDictionary *)error;
- (void)nodejsProcess:(KCNodeJS *)process didSentMessage:(NSDictionary *)messgage;
- (void)nodejsProcess:(KCNodeJS *)process didThrowParseError:(NSString *)error withString:(NSString *)string;
@end


@interface KCNodeJS : NSObject <MFTaskDelegateProtocol, SBJsonStreamParserAdapterDelegate>
{
	NSString *nodePath;

	MFTask *process;
	NSPipe *processStdInPipe;
	NSFileHandle *processStdIn;
	NSTimer *keepAliveTimer;

	SBJsonStreamParserAdapter *jsonAdapter;
	SBJsonStreamParser *jsonParser;
}

@property (nonatomic, weak) id delegate;

+ (KCNodeJS *)process;

- (void)launchScriptPath:(NSString *)scriptPath scriptName:(NSString *)scriptName andEnvironment:(NSDictionary *)env;
- (void)sendMessage:(NSDictionary *)message;

@end
