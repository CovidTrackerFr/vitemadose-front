# Bootstrap

Run :
- `npm install`
- `./node_modules/.bin/cordova prepare`

# Running in debug mode :

## Pre-requisites

A pre-requisite is to have the web version being built (`dist` folder generated) by vite :
see "production" section in parent directory.

For debug purposes, it may be helpful to configure Vite's `build.sourcemap=true` build configuration
property in order to be able to have sourcemaps during your debug session 
(otherwise, it's hard to debug a minified source code...)

For iOS : you need a Mac with XCode installed.

## Android

- Launch an Android emulator (using Android studio for example)
- Run `npm run pkg-debug-android` once for all
- Then run `npm run run-debug-android` to build and deploy your APK file under your Android emulator
- Open chrome on your desktop, and url : chrome://inspect
- You should be able to see your running VMD app in the inspect list, then debug it remotely

## iOS

- Run `npm run pkg-debug-ios` once for all
- Then run `npm run run-debug-ios` to prepare XCode workspace
- Open generated workspace into XCode : `platforms/ios/ViteMaDose.xcworkspace`
- On the upper bar, select an iOS emulator, then click the "play" button to build and deploy
  the IPA file onto the emulator
- Open Safari, and go to `Development` menu > `Simulator - xxxx` >  `vmd.local`, it will open
  Safari devtools and you will be able to debug the app remotely

# Production artefacts generation

_To be defined, later_

