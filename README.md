# Iggy Pop’s BBC Radio 6 Music Programme Recordings

Every Friday Iggy Pop plays two hours of tunes on BBC Radio 6 Music. I record his broadcasts and publish them at [mavsic.ru/iggy](http://mavsic.ru/iggy).


## Build process

Project is build using RequireJS Optimizer, so it should be installed on your system. Run (from project root directory):

    r.js -o build.js
  
On Windows you should probably run:

    r.js.cmd -o build.js

After build is competed files from ``build/`` directory can be deployed to server.

## Sublime Text Build System

It also comes with a preconfigured Sublime Text project which includes a simple build system to run the build process (for Windows).
