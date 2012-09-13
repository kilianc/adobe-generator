//
//  KCSystemInfo.h
//  KCKit
//
//  Created by Kilian Ciuffolo on 9/5/12.
//  Copyright (c) 2012 RelaxedBit™. All rights reserved.
//

@interface JKSystemInfo : NSObject

+ (NSString *)serialNumber;
+ (NSString *)UUID;
+ (NSString *)machineModelIdentifier;
+ (NSString *)machineIconHash;
+ (NSString *)systemVersionString;
+ (NSImage *)userImage;
+ (NSString *)userImageHash;
+ (NSString *)machineHostname;

@end
