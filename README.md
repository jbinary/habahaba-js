habahaba-js
===========

Habahaba is an experimental Web XMPP client based on JSLiX — XMPP library for JS based on the XML ORM approach and yate — JS template engine which is similar to XSLT but based on JSON. It uses MVC pattern, strictly separating logic from view, so new views can be written easily, and a system of plugins to extend it's functionality.

building and installing
------------------------

At the very first you'll need:

* SVN to download CryptoJS
* node-js for yate to work
* yate:

```
sudo npm install -g yate
```

First, clone the repo:

```
git clone git://github.com/jbinary/habahaba-js.git
```

Some of dependencies are shipped as git submodules, so we need to fetch them first:

```
git submodule init
git submodule update
```

Dependencies that couldn't be added as submodules are needed to be downloaded, we have a script that can do it for you:

```
./download-dependencies.sh
```

Now you can build the build:

```
cd src
make all
```

Now you have the build in the build directory, you can point your web server's root to this directory.

Also, you'll need to setup a BOSH-server to make it possible to reach XMPP servers through HTTP. Please, refer [this page](https://github.com/jappix/jappix/wiki/BoshServer) for it.
