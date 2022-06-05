<h1 align="center">math-o-matic</h1>
<p align="center"><a href="https://math-o-matic.github.io/math-o-matic/web/dist/index.html">main page</a> &middot; <a href="https://math-o-matic.github.io/math-o-matic/docs/build/index.html">docs</a></p>

[![npm](https://img.shields.io/npm/v/math-o-matic)](https://www.npmjs.com/package/math-o-matic)
[![GitHub](https://img.shields.io/github/license/math-o-matic/math-o-matic)](https://github.com/math-o-matic/math-o-matic/blob/master/LICENSE)
[![Node.js CI](https://github.com/math-o-matic/math-o-matic/actions/workflows/test-and-build.yml/badge.svg)](https://github.com/math-o-matic/math-o-matic/actions/workflows/test-and-build.yml)
[![Coverage Status](https://img.shields.io/coveralls/github/math-o-matic/math-o-matic)](https://coveralls.io/github/math-o-matic/math-o-matic?branch=master)
[![LGTM Alerts](https://img.shields.io/lgtm/alerts/github/math-o-matic/math-o-matic)](https://lgtm.com/projects/g/math-o-matic/math-o-matic/alerts/)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/math-o-matic/math-o-matic)](https://lgtm.com/projects/g/math-o-matic/math-o-matic/context:javascript)

**math-o-matic** is a program that lets you create a proof system and prove its theorems, in the most rigorous way possible. Its aim is to make it easy to read and write rigorous mathematical proofs. You can take a look at the current system by clicking on one of the links at the bottom of the [main page](https://math-o-matic.github.io/math-o-matic/web/dist/index.html).

## Setting up the environment

Install git & Node.js and run:

```shell
git clone https://github.com/math-o-matic/math-o-matic.git
cd math-o-matic
npm install
npm run build
```

## Creating your first proof system

Suppose that you want to create a simple proof system about the natural numbers characterized by the axiom

* <b>A1.</b> nat(0),

where nat(*n*) means "*n* is a natural number," and the inference rule

* <b>R1.</b> From nat(*n*), infer nat(successor(*n*)),

and prove that 2 is a natural number, where 2 is defined as successor(successor(0)).

Create the file `math/com/example/Natural.math` and write:

```ts
package com.example;

system Natural {
    "The proposition type."
    type prop;

    "The object type."
    type obj;
    
    "The primitive notion that given an object, tells if the
    object is a natural number or not."
    prop nat(obj o);

    "The successor of a natural number."
    obj successor(obj o);

    "The natural number 0."
    $0$
    obj zero;
    
    "The natural number 1."
    $1$
    obj one = successor(zero);
    
    "The natural number 2."
    $2$
    obj two = successor(one);

    "Axiom A1."
    axiom nat_zero() {
        nat(zero)
    }

    "Inference rule R1."
    axiom nat_successor(obj n) {
        nat(n) |- nat(successor(n))
    }
    
    "2 is a natural number."
    theorem nat_two() {
        /*
         * nat_zero() proves nat(zero), and nat_successor(zero)
         * proves nat(zero) |- nat(successor(zero)). The left associative
         * `>` operator then proves nat(successor(zero)) from the two
         * operands, then the next `>` proves nat(successor(one)) from the
         * operands nat(one) and nat(one) |- nat(successor(one)). The
         * `as` operator makes sure that nat(successor(one)) and nat(two)
         * are the same thing and changes the displayed formula from
         * nat(successor(one)) to nat(two).
         *
         * Check out the proof explorer from web/dist/index.html to watch this
         * in action.
         */
        nat_zero()
        > nat_successor(zero)
        > nat_successor(one)
        as nat(two)
    }
}
```

Then open the file `web/systempath.json` and write:

```json
{
    "paths": [
        "../math/"
    ],
    "systems": {
        "com.example": {
            "Natural": "Natural numbers"
        }
    }
}
```

Open `web/dist/index.html` in the browser and click on <code><b>system</b> Natural</code> to see the rendered proof system. For example the theorem `nat_two` will be rendered as follows:

<p align="center"><img src="https://i.imgur.com/cKuIigA.png" width="500px"></p>

The green color indicates that the math-o-matic program succeeded to validate the theorem or the axiom.

## The proof system we're building

Otherwise you can [take a look at](https://math-o-matic.github.io/math-o-matic/web/dist/index.html) & [contribute](/CONTRIBUTING.md) to the proof system we're currently building, located in the [`/math`](/math) directory. Our proof system is based on natural deduction and the Morse&ndash;Kelley set theory and managed to prove theorems like:

* 1 + 1 = 2 (`std.Natural.one_plus_one_is_two`),
* Recursion theorem (`std.Natural.recursion_theorem`),
* The principle of mathematical induction (`std.Natural.induce`),
* Cantor's theorem (`std.Function.cantor`),
* Schröder–Bernstein theorem (`std.Natural.schroeder_bernstein`).

## More stuff

* Find more math-o-matic code under the [/math](/math) directory.
* Refer to the [documentation](https://math-o-matic.github.io/math-o-matic/docs/build/index.html) to learn how to write proofs.
* math-o-matic language support for Visual Studio Code can be found [here](https://github.com/math-o-matic/vscode).
