//
//  KCSystemInfo.m
//  KCKit
//
//  Created by Kilian Ciuffolo on 9/5/12.
//  Copyright (c) 2012 RelaxedBit™. All rights reserved.
//

#import <Collaboration/Collaboration.h>
#include <sys/types.h>
#include <sys/sysctl.h>

#import "KCSystemInfo.h"
#import "NSData+CryptoHashing.h"

@implementation JKSystemInfo

+ (NSString *)serialNumber
{
    io_service_t platformExpert = IOServiceGetMatchingService(kIOMasterPortDefault , IOServiceMatching("IOPlatformExpertDevice"));
    CFStringRef serialNumberAsCFString = NULL;
    
    if(platformExpert)
	{
		serialNumberAsCFString = IORegistryEntryCreateCFProperty(platformExpert, CFSTR(kIOPlatformSerialNumberKey), kCFAllocatorDefault, 0);
        IOObjectRelease(platformExpert);
    }
    
    NSString *serialNumberAsNSString = nil;

    if(serialNumberAsCFString)
	{
		serialNumberAsNSString = [NSString stringWithString:(__bridge NSString *)serialNumberAsCFString];
        CFRelease(serialNumberAsCFString);
    }
    
    return serialNumberAsNSString;
}

+ (NSString *)UUID
{
    io_service_t platformExpert = IOServiceGetMatchingService(kIOMasterPortDefault , IOServiceMatching("IOPlatformExpertDevice"));
    CFStringRef UUIDAsCFString = NULL;
    
    if(platformExpert)
	{
		UUIDAsCFString = IORegistryEntryCreateCFProperty(platformExpert, CFSTR(kIOPlatformUUIDKey), kCFAllocatorDefault, 0);
        IOObjectRelease(platformExpert);
    }
    
    NSString *UUIDAsNSString = nil;
	
    if(UUIDAsCFString)
	{
		UUIDAsNSString = [NSString stringWithString:(__bridge NSString *)UUIDAsCFString];
        CFRelease(UUIDAsCFString);
    }
    
    return UUIDAsNSString;
}


+ (NSString *)machineModelIdentifier
{
	size_t modelSize;
	NSString *modelString = nil;
    int modelInfo[2] = { CTL_HW, HW_MODEL };
    
    if(!sysctl(modelInfo, 2, NULL, &modelSize, NULL, 0))
    {
        void *modelData = malloc(modelSize);

        if(modelData)
        {
            if(!sysctl(modelInfo, 2, modelData, &modelSize, NULL, 0))
                modelString = [NSString stringWithUTF8String:modelData];
            
            free(modelData);
        }
    }
    
    return modelString;
}

+ (NSString *)machineIconHash
{
	IconRef iconRef;
	GetIconRef(kOnSystemDisk, kSystemIconsCreator, kComputerIcon, &iconRef);
	
	NSImage *image = [[NSImage alloc] initWithIconRef:iconRef];
	NSArray *reps = [image representations];
	__block NSString *hash = nil;
	
	[reps enumerateObjectsUsingBlock:^(NSBitmapImageRep *obj, NSUInteger idx, BOOL *stop) {
		
		if(obj.size.width == 128)
		{
			hash = [[obj representationUsingType:NSPNGFileType properties:nil] md5HexHash];
			*stop = true;
		}
	}];

	return hash;
}

+ (NSString *)userImageHash
{
	NSImage *image = [self userImage];
	NSBitmapImageRep *rep = [[image representations] objectAtIndex:0];

	return [[rep representationUsingType:NSPNGFileType properties:nil] md5HexHash];
}

+ (NSImage *)userImage
{
	CBIdentity *identity = [CBIdentity identityWithName:NSUserName() authority:[CBIdentityAuthority defaultIdentityAuthority]];
	return [identity image];
}

+ (NSString *)systemVersionString
{
	SInt32 versionMajor = 0;
	SInt32 versionMinor = 0;
	SInt32 versionBugFix = 0;
	Gestalt(gestaltSystemVersionMajor, &versionMajor);
	Gestalt(gestaltSystemVersionMinor, &versionMinor);
	Gestalt(gestaltSystemVersionBugFix, &versionBugFix);

	return [NSString stringWithFormat:@"%d.%d.%d", versionMajor, versionMinor, versionBugFix];
}

+ (NSString *)machineHostname
{
	NSString *hostname = [[NSHost currentHost] name];
	return [hostname substringWithRange:NSMakeRange(0, [hostname length] - 6)];
}

@end
