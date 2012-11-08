# motherlover

![](http://f.cl.ly/items/1r08041h112N0U3o091q/motherlover.png)

## Installation and first run

    ⚡ git clone git@github.com:kilianc/motherlover.git && cd motherlover
    ⚡ cp Custom.xcconfig.dist Custom.xcconfig
    ⚡ cd Motherlover/Resources/server/
    ⚡ npm install

Compile and run from xcode

## Dependencies

You need node and npm on your system to download dependencies, you can [download the binary](http://nodejs.org/download/) or [compile it from source code](https://github.com/joyent/node/blob/master/README.md)

Then check your node and npm versions

    ⚡ node -v
    v0.8.14
    ⚡ npm -v
    1.1.65

You need cairo to install node-canvas

    ⚡ brew install cairo

If you're having trouble installing [cairo](http://cairographics.org/) or [node-canvas](https://github.com/LearnBoost/node-canvas), here there is a [precompiled version of the module](http://cl.ly/2m0P2i101T1a) for OSX. node-canvas needs `libjpeg.8.dylib` that is [bundled here](https://github.com/kilianc/motherlover/tree/develop/Motherlover/Resources/server/dylib) and loaded at runtime setting the env variable `DYLD_LIBRARY_PATH` to a custom folder, in our case `./dylib`