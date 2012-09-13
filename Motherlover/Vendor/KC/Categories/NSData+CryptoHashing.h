//
//  NSData+CryptoHashing.h
//  KCKit
//
//  Created by Kilian Ciuffolo on 9/5/12.
//  Copyright (c) 2012 RelaxedBit™. All rights reserved.
//

@interface NSData (NSData_CryptoHashing)

- (NSData *)md5Hash;
- (NSString *)md5HexHash;

- (NSData *)sha1Hash;
- (NSString *)sha1HexHash;

- (NSData *)sha256Hash;
- (NSString *)sha256HexHash;

- (NSData *)sha512Hash;
- (NSString *)sha512HexHash;

@end