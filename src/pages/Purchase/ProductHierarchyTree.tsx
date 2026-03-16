import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Check, Minus } from 'lucide-react';
import type { HierarchyNode } from '../../services/productSearchService';

interface ProductHierarchyTreeProps {
  nodes: HierarchyNode[];
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
}

const getAllLeafKeys = (node: HierarchyNode): string[] => {
  if (!node.children || node.children.length === 0) {
    return [node.key];
  }
  return node.children.flatMap(getAllLeafKeys);
};

const getAllKeys = (node: HierarchyNode): string[] => {
  const keys = [node.key];
  if (node.children) {
    node.children.forEach((child) => {
      keys.push(...getAllKeys(child));
    });
  }
  return keys;
};

const getCheckState = (
  node: HierarchyNode,
  selectedKeys: Set<string>
): 'checked' | 'unchecked' | 'indeterminate' => {
  if (!node.children || node.children.length === 0) {
    return selectedKeys.has(node.key) ? 'checked' : 'unchecked';
  }

  const allDescendantKeys = getAllKeys(node).filter((k) => k !== node.key);
  const leafKeys = getAllLeafKeys(node);
  const checkedLeaves = leafKeys.filter((k) => selectedKeys.has(k)).length;

  if (checkedLeaves === 0) {
    return 'unchecked';
  }
  if (checkedLeaves === leafKeys.length && allDescendantKeys.every((k) => selectedKeys.has(k))) {
    return 'checked';
  }
  return 'indeterminate';
};

interface TreeNodeProps {
  node: HierarchyNode;
  selectedKeys: Set<string>;
  onToggle: (node: HierarchyNode) => void;
  level: number;
}

const TreeNode = ({ node, selectedKeys, onToggle, level }: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const checkState = getCheckState(node, selectedKeys);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-gray-100 cursor-pointer select-none"
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={() => onToggle(node)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-4.5" />
        )}

        <div
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
            checkState === 'checked'
              ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
              : checkState === 'indeterminate'
              ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
              : 'border-gray-400 bg-white'
          }`}
        >
          {checkState === 'checked' && <Check className="w-3 h-3 text-white" />}
          {checkState === 'indeterminate' && <Minus className="w-3 h-3 text-white" />}
        </div>

        <span className="text-sm text-[var(--color-text)] truncate">{node.title}</span>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              selectedKeys={selectedKeys}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductHierarchyTree = ({
  nodes,
  selectedKeys,
  onSelectionChange,
}: ProductHierarchyTreeProps) => {
  const handleToggle = useCallback(
    (node: HierarchyNode) => {
      const newKeys = new Set(selectedKeys);
      const allNodeKeys = getAllKeys(node);
      const checkState = getCheckState(node, selectedKeys);

      if (checkState === 'checked') {
        allNodeKeys.forEach((k) => newKeys.delete(k));
      } else {
        allNodeKeys.forEach((k) => newKeys.add(k));
      }

      onSelectionChange(newKeys);
    },
    [selectedKeys, onSelectionChange]
  );

  if (nodes.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center">
        No hierarchy data available
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
      {nodes.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          selectedKeys={selectedKeys}
          onToggle={handleToggle}
          level={0}
        />
      ))}
    </div>
  );
};
