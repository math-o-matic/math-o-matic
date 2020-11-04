import { assert } from "chai";
import Program from "../src/Program";
var pegjs = require('pegjs');
var fs = require('fs');
var path = require('path');

var grammar = fs.readFileSync(path.join(__dirname, '../src/grammar.pegjs'), 'utf-8');
var evalParser = pegjs.generate(grammar, {cache: true, allowedStartRules: ['evaluable']});

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);

      console.log(new Program(evalParser).evaluate(evalParser.parse('type st;')));
    });
  });
});