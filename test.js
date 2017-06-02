// @flow
'use strict';

const pluginTester = require('babel-plugin-tester');
const getBabylonOptions = require('babylon-options');
const printAST = require('ast-pretty-print');
const {getFlowBindingsInScope} = require('./');

const babelOptions = {
  parserOpts: getBabylonOptions({
    stage: 0,
    plugins: ['flow'],
  }),
};

const plugin = ({ types: t }) => {
  let getOutput = path => {
    let bindings = getFlowBindingsInScope(path);
    let printed = printAST(bindings) + '\n';
    return t.expressionStatement(
      t.templateLiteral([
        t.templateElement({ raw: printed }, true)
      ], [])
    );
  };

  return {
    name: 'test-plugin',
    visitor: {
      Program(path) {
        path.unshiftContainer('body', getOutput(path));
      },
      'ClassDeclaration|FunctionDeclaration|InterfaceDeclaration|TypeAlias'(path) {
        path.insertAfter(getOutput(path));
      },
      ClassExpression(path) {
        path.find(p => p.isDeclaration()).insertAfter(getOutput(path));
      }
    },
  };
};

pluginTester({
  plugin,
  snapshot: true,
  babelOptions,
  tests: {
    'import type': 'import type a from "mod";',
    'import {type}': 'import {type a} from "mod";',
    'import typeof': 'import typeof {a} from "mod";',
    'import {typeof}': 'import {typeof a} from "mod";',
    'type alias': 'type a = {};',
    'interface declaration': 'interface a {}',
    'class declaration': 'class a {}',
    'type alias params': 'type a<b> = {}',
    'interface params': 'interface a<b> {}',
    'class params': 'class a<b> {}',
    'function params': 'function a<b>() {}',
    'nested': 'function a<b>() {}',
    'class expression': 'let a = class b {}',
  }
})
