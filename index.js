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

type Binding = {
  kind: 'import' | 'declaration' | 'expression' | 'param',
  path: Path,
};

type Bindings = {
  [name: string]: Binding,
};

type Visitor = {
  [method: string]: (path: Path, state: { bindings: Bindings }) => void;
};
*/

let getId = (kind, path, bindings) => {
  if (path.node.id) {
    let id = path.get('id');
    bindings[id.node.name] = {kind, path: id};
  }
};

let visitor /*: Visitor */  = {
  Scope(path) {
    path.skip();
  },

  Declaration(path, state) {
    if (
      path.isInterfaceDeclaration() ||
      path.isTypeAlias() ||
      path.isClassDeclaration()
    ) {
      getId('declaration', path, state.bindings);
    }

    if (!path.isImportDeclaration() && !path.isExportDeclaration()) {
      path.skip();
    }
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

  if (scopePath.isClassExpression()) {
    getId('expression', scopePath, bindings);
  } else {
    scopePath.traverse(visitor, { bindings });
  }

  return bindings;
}

function findFlowBinding(path /*: Path */, name /*: string */) /*: Binding | null */ {
  let scopePath = path;
  let binding;

  do {
    scopePath = getFlowScopePath(scopePath);
    let bindings = getFlowBindingsInScope(scopePath);
    if (bindings[name]) return bindings[name];
  } while (scopePath = scopePath.parentPath);

  return null;
}

exports.getFlowScopePath = getFlowScopePath;
exports.getFlowBindingsInScope = getFlowBindingsInScope;
exports.findFlowBinding = findFlowBinding;
