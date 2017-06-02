// @flow
'use strict';

/*::
type Node = {
  type: string,
  [key: string]: any,
};

type Path = {
  type: string,
  node: Node,
  [key: string]: any,
};

type Bindings = {
  [name: string]: {
    kind: 'param' | 'hoisted' | 'import',
    id: Node,
    path: Path,
  },
};
*/

let visitor = {
  Scope(path) {
    path.skip();
  },

  'InterfaceDeclaration|TypeAlias'(path, state) {
    let id = path.get('id');
    state.bindings[id.node.name] = {kind: 'declaration', path: id};
    path.skip();
  },

  TypeParameter(path, state) {
    state.bindings[path.node.name] = {kind: 'param', path};
  },

  'ImportSpecifier|ImportDefaultSpecifier'(path, state) {
    let importKind = path.node.importKind || path.parent.importKind;
    if (importKind !== 'type' && importKind !== 'typeof') return;
    let local = path.get('local');
    state.bindings[local.node.name] = {kind: 'import', path: local};
  },
};

function getFlowScopePath(path /*: Path */) /*: Path */ {
  return path.find(p => {
    return (
      p.isScope() ||
      p.isTypeAlias() ||
      p.isInterfaceDeclaration()
    );
  });
}

function getFlowBindingsInScope(path /*: Path */) /*: Bindings */ {
  let scopePath = getFlowScopePath(path);
  let bindings = {};

  scopePath.traverse(visitor, { bindings });

  return bindings;
}

exports.getFlowScopePath = getFlowScopePath;
exports.getFlowBindingsInScope = getFlowBindingsInScope;
