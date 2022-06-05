# Contributing to math-o-matic

## Setting up the environment

Install git & Node.js and run:

```shell
git clone https://github.com/math-o-matic/math-o-matic.git
cd math-o-matic
npm run install-all
npm run build
```

Upon a successful build `math-o-matic.min.js` and `math-o-matic.min.js.map` are generated at `/dist`.

## Testing your code

* Run the build and see if the web page works as you expect.
* Run `npm test` and see if the tests are passing.
