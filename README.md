<h1 align="center">math-o-matic</h1>
<p align="center"><a href="https://math-o-matic.github.io/math-o-matic/docs/build/index.html">docs</a> &middot; <a href="https://math-o-matic.github.io/math-o-matic/web/index.html">main page</a></p>

[![npm](https://img.shields.io/npm/v/math-o-matic)](https://www.npmjs.com/package/math-o-matic)
[![GitHub](https://img.shields.io/github/license/math-o-matic/math-o-matic)](https://github.com/math-o-matic/math-o-matic/blob/master/LICENSE)
[![Node.js CI](https://github.com/math-o-matic/math-o-matic/actions/workflows/test-and-build.yml/badge.svg)](https://github.com/math-o-matic/math-o-matic/actions/workflows/test-and-build.yml)
[![Coverage Status](https://img.shields.io/coveralls/github/math-o-matic/math-o-matic)](https://coveralls.io/github/math-o-matic/math-o-matic?branch=master)
[![LGTM Alerts](https://img.shields.io/lgtm/alerts/github/math-o-matic/math-o-matic)](https://lgtm.com/projects/g/math-o-matic/math-o-matic/alerts/)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/math-o-matic/math-o-matic)](https://lgtm.com/projects/g/math-o-matic/math-o-matic/context:javascript)

**math-o-matic** is a computerized proof system that lets you create an axiomatic system and prove its theorems. Its aim is to make it easy to read and write rigorous mathematical proofs. You can see the current axiomatic system by pressing one of the buttons at the bottom of the [main page](https://math-o-matic.github.io/math-o-matic/web/index.html).

## Code example

<pre><code>"[$1+1=2]이다."
<b>theorem</b> one_plus_one_is_two() {
    one_in_omega()
    &gt; omega_add_one(omega_one) <b>as</b> eq(omega_add(omega_one, omega_one), omega_two)
}</code></pre>

This code produces&hellip;

<p align="center"><img src="https://i.imgur.com/lSWwhW6.png" width="500px"><br>
<i>A proof of</i> <code>1 + 1 = 2</code></p>

&hellip;a proof of the equation `1 + 1 = 2`. The proof is verified by the math-o-matic program, and the name of the theorem is colored green if the proof is valid. The **proof explorer** also shows the individual steps of the proof in a human-readable format. Here, green names refer to theorems that are already proved, and blue symbols indicate predefined notions.

## Keep reading

* Find more math-o-matic code in [/math](/math) directory.
* Refer to the [documentation](https://math-o-matic.github.io/math-o-matic/docs/build/index.html) to learn how to write proofs.
* Click on the colored parts of the previous proof in the [main page](https://math-o-matic.github.io/math-o-matic/web/index.html) to jump to definitions.
* math-o-matic language support for Visual Studio Code can be found [here](https://github.com/math-o-matic/vscode).
