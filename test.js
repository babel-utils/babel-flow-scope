// @flow
'use strict';

const pluginTester = require('babel-plugin-tester');
const getBabylonOptions = require('babylon-options');
const printAST = require('ast-pretty-print');
const {getFlowBindingsInScope, findFlowBinding} = require('./');

const babelOptions = {
  parserOpts: getBabylonOptions({
    stage: 0,
    plugins: ['flow'],
  }),
};

const print = (t, value) => {
  let printed = printAST(value) + '\n';
  return t.expressionStatement(
    t.templateLiteral([
      t.templateElement({ raw: printed }, true)
    ], [])
  );
};

const capturePlugin = ({ types: t }) => {
  let getOutput = path => {
    return print(t, getFlowBindingsInScope(path));
  };

  return {
    name: 'test-capture-plugin',
    visitor: {
      Program(path) {
        path.unshiftContainer('body', getOutput(path));
      },
      'ClassDeclaration|FunctionDeclaration|InterfaceDeclaration|TypeAlias'(path) {
        if (path.parentPath.isExportDeclaration()) {
          path.parentPath.insertAfter(getOutput(path));
        } else {
          path.insertAfter(getOutput(path));
        }
      },
      ClassExpression(path) {
        path.find(p => p.isDeclaration()).insertAfter(getOutput(path));
      }
    },
  };
};

pluginTester({
  plugin: capturePlugin,
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
    'export type alias': 'export type a = {}',
    'export interface declaration': 'export interface a {}',
    'export class declaration': 'export class a {}',
    'export default class declaration': 'export default class a {}',
  }
});

const searchPlugin = ({ types: t }) => {
  let getOutput = path => {
    return print(t, findFlowBinding(path, 'END'));
  };

  return {
    name: 'test-search-plugin',
    visitor: {
      Identifier(path) {
        if (path.node.name === 'START') {
          path.find(p => p.isStatement()).insertAfter(getOutput(path));
        }
      }
    },
  };
};

pluginTester({
  plugin: searchPlugin,
  snapshot: true,
  babelOptions,
  tests: {
    'current scope': 'type END = 1; START;',
    'nested scope': 'type END = 1; function a() { START; }',
    'deep nested scope': 'type END = 1; function a() { function b() { START; } }',
  }
})
