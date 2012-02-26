# nCore [![Build Status][1]][2]

A Core library for your node application infrastructure.

## Status: Rewrite in progress

 - <a href="#example"> example </a>
 - <a href="#motivation"> motivation </a>
 - <a href="#docs"> docs </a>
 - <a href="#install"> Installation </a>
 - <a href="#test"> test </a>
 - <a href="#contributors"> contributors </a>
 - <a href="#licence"> licence </a>

## Example <a name="example" href="#example"><small><sup>link</sup></small></a>

``` javascript
var Core = Object.create(require("nCore")).constructor({
        server: {
            controller: "hello-world"
        }
    }),
    http = require("http");

Core.use("hello-world", {
    define: function (interface) {
        interface.print = function (req, res) {
            res.end("hello world");
        };
    }
})

Core.use("server", {
    inject: function (deps) {
        http.createServer(function (req, res) {
            deps.controller.print(req, res);
        }).listen(8080);
    }
});

Core.init();
```

## Motivation <a name="motivation" href="#motivation"><small><sup>link</sup></small></a>

nCore is a dependency injection framework.

 - It strictly defines what a unit is and makes it easy to mock out that unit's dependencies. This makes testing and TDD easy
 - It injects dependencies into your modules based on a file based configuration system and allows you to define the public interface of a module either using methods or using event emitters. This allows for loose coupling and encapsulation.
 - It has support for hot reloading of modules. This basically means removing and adding modules on the fly whilst your core is still running

## Documentation <a name="docs" href="#docs"><small><sup>link</sup></small></a>

 - [nCore 0.x documentation][3]
 - [Core.constructor][8]
 - [Core.use][4]
 - [Core.init][5]
 - [Core.remove][6]
 - [Core.purge][7]

### Core.constructor(deps, [ee]) <a name="constructor" href="#constructor"><small><sup>link</sup></small></a>

Instantiate an instance of the core. You need to pass the dependency mapping to the core so it knows what to inject into what module. You can also optionally pass in EventEmitter prototype which will be mixed into every interface.

<details><summary> Examples </summary>
    <div class="highlight">
        <pre>
            Content
        </pre>
    </div>
</details>

/* TODO */

## Installation <a name="install" href="#install"><small><sup>link</sup></small></a>

`$ npm install ncore`

## Test <a name="test" href="#test"><small><sup>link</sup></small></a>

`$ make test`

## contributors <a name="contributors" href="#contributors"><small><sup>link</sup></small></a>

 - Raynos

## MIT Licenced <a name="licence" href="#licence"><small><sup>link</sup></small></a>

  [1]: https://secure.travis-ci.org/Raynos/ncore.png
  [2]: http://travis-ci.org/Raynos/ncore
  [3]: https://github.com/Raynos/ncore/tree/0.x
  [4]: https://github.com/Raynos/ncore#use
  [5]: https://github.com/Raynos/ncore#init
  [6]: https://github.com/Raynos/ncore#remove
  [7]: https://github.com/Raynos/ncore#purge
  [8]: https://github.com/Raynos/ncore#constructor