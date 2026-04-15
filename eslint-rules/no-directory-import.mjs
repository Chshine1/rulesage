import path from 'path';
import fs from 'fs';

export const noDirectoryImport = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Must use index file to import, instead of directory import',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    
    function isDirectoryImport(node, importPath) {
      if (!importPath.startsWith('.')) return false;
      
      const baseDir = path.dirname(filename);
      const targetPath = path.resolve(baseDir, importPath);
      
      let stats;
      try {
        stats = fs.statSync(targetPath);
      } catch (err) {
        return false;
      }
      
      if (!stats.isDirectory()) return false;
      
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      return extensions.some(ext => fs.existsSync(path.join(targetPath, `index${ext}`)));
    }
    
    function fixDirectoryImport(importPath) {
      if (importPath.endsWith('/index')) return importPath;
      if (/\/index\.(ts|tsx|js|jsx)$/.test(importPath)) return importPath;
      return importPath + '/index';
    }
    
    function checkImportSource(node, sourceValue) {
      if (isDirectoryImport(node, sourceValue)) {
        context.report({
          node,
          message: `Importing directory "{{path}}" is forbidden, explicitly import "{{path}}/index" instead`,
          data: { path: sourceValue },
          fix(fixer) {
            const fixedPath = fixDirectoryImport(sourceValue);
            return fixer.replaceText(node.source, `'${fixedPath}'`);
          },
        });
      }
    }
    
    // noinspection JSUnusedGlobalSymbols
    return {
      ImportDeclaration(node) {
        if (node.source && node.source.value) {
          checkImportSource(node, node.source.value);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source && node.source.value) {
          checkImportSource(node, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        if (node.source && node.source.value) {
          checkImportSource(node, node.source.value);
        }
      },
    };
  },
};