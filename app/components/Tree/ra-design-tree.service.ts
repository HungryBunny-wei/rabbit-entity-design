/**
 * @license
 * Copyright Alibaba.com All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/LICENSE
 */

import { Observable, Subject } from 'rxjs';
import { NzFormatEmitEvent } from './interface';
import { TreeNodeModel } from './tree-node.model';
import { isCheckDisabled, isInArray } from './nz-tree-util';

export function isNotNil<T>(value: T): value is NonNullable<T> {
  return typeof value !== 'undefined' && value !== null;
}

export class RaDesignTreeService {
  DRAG_SIDE_RANGE = 0.25;
  DRAG_MIN_GAP = 2;

  isCheckStrictly: boolean = false;
  isMultiple: boolean = false;
  selectedNode: TreeNodeModel;
  rootNodes: TreeNodeModel[] = [];
  selectedNodeList: TreeNodeModel[] = [];
  expandedNodeList: TreeNodeModel[] = [];
  checkedNodeList: TreeNodeModel[] = [];
  halfCheckedNodeList: TreeNodeModel[] = [];
  matchedNodeList: TreeNodeModel[] = [];
  triggerEventChange$ = new Subject<NzFormatEmitEvent>();

  static forEachTree<T>(node: Array<T & { children?: T[] }>, call: (value: T) => boolean | void) {
    node.forEach((_n) => {
      if (call(_n)) {
        return true;
      }
      if (_n.children && _n.children.length > 0) {
        RaDesignTreeService.forEachTree(_n.children, call);
      }
    });
  }

  /**
   * trigger event
   */
  eventTriggerChanged(): Observable<NzFormatEmitEvent> {
    return this.triggerEventChange$.asObservable();
  }

  /**
   * reset tree nodes will clear default node list
   */
  initTree(nzNodes: TreeNodeModel[]): void {
    this.rootNodes = nzNodes;
    this.expandedNodeList = [];
    this.selectedNodeList = [];
    this.halfCheckedNodeList = [];
    this.checkedNodeList = [];
    this.matchedNodeList = [];
    // refresh node checked state
    setTimeout(() => {
      this.refreshCheckState(this.isCheckStrictly);
    });
  }

  getSelectedNode(): TreeNodeModel | null {
    return this.selectedNode;
  }

  /**
   * get some list
   */
  getSelectedNodeList(): TreeNodeModel[] {
    return this.conductNodeState('select');
  }

  /**
   * return checked nodes
   */
  getCheckedNodeList(): TreeNodeModel[] {
    return this.conductNodeState('check');
  }

  getHalfCheckedNodeList(): TreeNodeModel[] {
    return this.conductNodeState('halfCheck');
  }

  /**
   * return expanded nodes
   */
  getExpandedNodeList(): TreeNodeModel[] {
    return this.conductNodeState('expand');
  }

  /**
   * return search matched nodes
   */
  getMatchedNodeList(): TreeNodeModel[] {
    return this.conductNodeState('match');
  }

  // tslint:disable-next-line:no-any
  isArrayOfNzTreeNode(value: any[]): boolean {
    return value.every(item => item instanceof TreeNodeModel);
  }

  /**
   * reset selectedNodeList
   */
  calcSelectedKeys(selectedKeys: string[], nzNodes: TreeNodeModel[], isMulti: boolean = false): void {
    const calc = (nodes: TreeNodeModel[]): boolean => {
      return nodes.every(node => {
        if (isInArray(node.key, selectedKeys)) {
          node.isSelected = true;
          if (!isMulti) {
            // if not support multi select
            return false;
          }
        } else {
          node.isSelected = false;
        }
        if (node.children.length > 0) {
          // Recursion
          return calc(node.children);
        }
        return true;
      });
    };
    calc(nzNodes);
  }

  /**
   * reset expandedNodeList
   */
  calcExpandedKeys(expandedKeys: string[], nzNodes: TreeNodeModel[]): void {
    this.expandedNodeList = [];
    const calc = (nodes: TreeNodeModel[]) => {
      nodes.forEach(node => {
        node.isExpanded = isInArray(node.key, expandedKeys);
        if (node.children.length > 0) {
          calc(node.children);
        }
      });
    };
    calc(nzNodes);
  }

  /**
   * reset checkedNodeList
   */
  calcCheckedKeys(checkedKeys: string[], nzNodes: TreeNodeModel[], isCheckStrictly: boolean = false): void {
    this.checkedNodeList = [];
    this.halfCheckedNodeList = [];
    const calc = (nodes: TreeNodeModel[]) => {
      nodes.forEach(node => {
        if (isInArray(node.key, checkedKeys)) {
          node.isChecked = true;
          node.isHalfChecked = false;
        } else {
          node.isChecked = false;
          node.isHalfChecked = false;
        }
        if (node.children.length > 0) {
          calc(node.children);
        }
      });
    };
    calc(nzNodes);
    // controlled state
    this.refreshCheckState(isCheckStrictly);
  }

  /**
   * set drag node
   */
  setSelectedNode(node: TreeNodeModel): void {
    this.selectedNode = node;
  }

  /**
   * set node selected status
   */
  setNodeActive(node: TreeNodeModel): void {
    if (!this.isMultiple && node.isSelected) {
      this.selectedNodeList.forEach(n => {
        if (node.key !== n.key) {
          // reset other nodes
          n.isSelected = false;
        }
      });
      // single mode: remove pre node
      this.selectedNodeList = [];
    }
    this.setSelectedNodeList(node, this.isMultiple);
  }

  /**
   * add or remove node to selectedNodeList
   */
  setSelectedNodeList(node: TreeNodeModel, isMultiple: boolean = false): void {
    const index = this.selectedNodeList.findIndex(n => node.key === n.key);
    if (isMultiple) {
      if (node.isSelected && index === -1) {
        this.selectedNodeList.push(node);
      }
    } else {
      if (node.isSelected && index === -1) {
        this.selectedNodeList = [node];
      }
    }
    if (!node.isSelected) {
      this.selectedNodeList = this.selectedNodeList.filter(n => n.key !== node.key);
    }
  }

  /**
   * merge checked nodes
   */
  setHalfCheckedNodeList(node: TreeNodeModel): void {
    const index = this.halfCheckedNodeList.findIndex(n => node.key === n.key);
    if (node.isHalfChecked && index === -1) {
      this.halfCheckedNodeList.push(node);
    } else if (!node.isHalfChecked && index > -1) {
      this.halfCheckedNodeList = this.halfCheckedNodeList.filter(n => node.key !== n.key);
    }
  }

  setCheckedNodeList(node: TreeNodeModel): void {
    const index = this.checkedNodeList.findIndex(n => node.key === n.key);
    if (node.isChecked && index === -1) {
      this.checkedNodeList.push(node);
    } else if (!node.isChecked && index > -1) {
      this.checkedNodeList = this.checkedNodeList.filter(n => node.key !== n.key);
    }
  }

  /**
   * conduct checked/selected/expanded keys
   */
  conductNodeState(type: string = 'check'): TreeNodeModel[] {
    let resultNodesList: TreeNodeModel[] = [];
    switch (type) {
      case 'select':
        resultNodesList = this.selectedNodeList;
        break;
      case 'expand':
        resultNodesList = this.expandedNodeList;
        break;
      case 'match':
        resultNodesList = this.matchedNodeList;
        break;
      case 'check':
        resultNodesList = this.checkedNodeList;
        const isIgnore = (node: TreeNodeModel): boolean => {
          const parentNode = node.getParentNode();
          if (parentNode) {
            if (this.checkedNodeList.findIndex(n => n.key === parentNode.key) > -1) {
              return true;
            } else {
              return isIgnore(parentNode);
            }
          }
          return false;
        };
        // merge checked
        if (!this.isCheckStrictly) {
          resultNodesList = this.checkedNodeList.filter(n => !isIgnore(n));
        }
        break;
      case 'halfCheck':
        if (!this.isCheckStrictly) {
          resultNodesList = this.halfCheckedNodeList;
        }
        break;
    }
    return resultNodesList;
  }

  /**
   * set expanded nodes
   */
  setExpandedNodeList(node: TreeNodeModel): void {
    if (node.isLeaf) {
      return;
    }
    const index = this.expandedNodeList.findIndex(n => node.key === n.key);
    if (node.isExpanded && index === -1) {
      this.expandedNodeList.push(node);
    } else if (!node.isExpanded && index > -1) {
      this.expandedNodeList = this.expandedNodeList.filter(n => node.key !== n.key);
    }
  }

  expandParent(p: TreeNodeModel) {
    // expand parent node
    if (p.getParentNode()) {
      p.getParentNode().isExpanded = true;
      this.setExpandedNodeList(p.getParentNode());
      this.expandParent(p.getParentNode());
    }
  }

  /**
   * check state
   * @param isCheckStrictly
   */
  refreshCheckState(isCheckStrictly: boolean = false): void {
    if (isCheckStrictly) {
      return;
    }
    this.checkedNodeList.forEach(node => {
      this.conduct(node);
    });
  }

  // reset other node checked state based current node
  conduct(node: TreeNodeModel): void {
    const isChecked = node.isChecked;
    if (node) {
      this.conductUp(node);
      this.conductDown(node, isChecked);
    }
  }

  /**
   * 1、children half checked
   * 2、children all checked, parent checked
   * 3、no children checked
   */
  conductUp(node: TreeNodeModel): void {
    const parentNode = node.getParentNode();
    if (parentNode) {
      if (!isCheckDisabled(parentNode)) {
        if (parentNode.children.every(child => isCheckDisabled(child) || (!child.isHalfChecked && child.isChecked))) {
          parentNode.isChecked = true;
          parentNode.isHalfChecked = false;
        } else if (parentNode.children.some(child => child.isHalfChecked || child.isChecked)) {
          parentNode.isChecked = false;
          parentNode.isHalfChecked = true;
        } else {
          parentNode.isChecked = false;
          parentNode.isHalfChecked = false;
        }
      }
      this.setCheckedNodeList(parentNode);
      this.setHalfCheckedNodeList(parentNode);
      this.conductUp(parentNode);
    }
  }

  /**
   * reset child check state
   */
  conductDown(node: TreeNodeModel, value: boolean): void {
    if (!isCheckDisabled(node)) {
      node.isChecked = value;
      node.isHalfChecked = false;
      this.setCheckedNodeList(node);
      this.setHalfCheckedNodeList(node);
      node.children.forEach(n => {
        this.conductDown(n, value);
      });
    }
  }

  /**
   * search value & expand node
   * should add expandlist
   */
  searchExpand(value: string): void {
    this.matchedNodeList = [];
    const expandedKeys: string[] = [];
    if (!isNotNil(value)) {
      return;
    }
    // to reset expandedNodeList
    const expandParent = (n: TreeNodeModel) => {
      // expand parent node
      const parentNode = n.getParentNode();
      if (parentNode) {
        expandedKeys.push(parentNode.key);
        expandParent(parentNode);
      }
    };
    const searchChild = (n: TreeNodeModel) => {
      if (value && n.title.includes(value)) {
        // match the node
        n.isMatched = true;
        this.matchedNodeList.push(n);
        // expand parentNode
        expandParent(n);
      } else {
        n.isMatched = false;
      }
      n.children.forEach(child => {
        searchChild(child);
      });
    };
    this.rootNodes.forEach(child => {
      searchChild(child);
    });
    // expand matched keys
    this.calcExpandedKeys(expandedKeys, this.rootNodes);
  }

  /**
   * flush after delete node
   */
  afterRemove(nodes: TreeNodeModel[]): void {
    // to reset selectedNodeList & expandedNodeList
    const loopNode = (node: TreeNodeModel) => {
      // remove selected node
      this.selectedNodeList = this.selectedNodeList.filter(n => n.key !== node.key);
      // remove expanded node
      this.expandedNodeList = this.expandedNodeList.filter(n => n.key !== node.key);
      // remove checked node
      this.checkedNodeList = this.checkedNodeList.filter(n => n.key !== node.key);
      if (node.children) {
        node.children.forEach(child => {
          loopNode(child);
        });
      }
    };
    nodes.forEach(n => {
      loopNode(n);
    });
    this.refreshCheckState(this.isCheckStrictly);
  }

  /**
   * drag event
   */
  refreshDragNode(node: TreeNodeModel): void {
    if (node.children.length === 0) {
      // until root
      this.conductUp(node);
    } else {
      node.children.forEach(child => {
        this.refreshDragNode(child);
      });
    }
  }

  // reset node level
  resetNodeLevel(node: TreeNodeModel): void {
    const parentNode = node.getParentNode();
    if (parentNode) {
      node.level = parentNode.level + 1;
    } else {
      node.level = 0;
    }
    for (const child of node.children) {
      this.resetNodeLevel(child);
    }
  }

  calcDropPosition(event: DragEvent): number {
    const { clientY } = event;
    // to fix firefox undefined
    const { top, bottom, height } = event.srcElement
      ? (event.srcElement as Element).getBoundingClientRect()
      : (event.target as Element).getBoundingClientRect();
    const des = Math.max(height * this.DRAG_SIDE_RANGE, this.DRAG_MIN_GAP);

    if (clientY <= top + des) {
      return -1;
    } else if (clientY >= bottom - des) {
      return 1;
    }

    return 0;
  }

  /**
   * drop
   * 0: inner -1: pre 1: next
   */
  dropAndApply(targetNode: TreeNodeModel, dragPos: number = -1): void {
    if (!targetNode || dragPos > 1) {
      return;
    }
    const treeService = targetNode.treeService;
    const targetParent = targetNode.getParentNode();
    const isSelectedRootNode = this.selectedNode.getParentNode();
    // remove the dragNode
    if (isSelectedRootNode) {
      isSelectedRootNode.children = isSelectedRootNode.children.filter(n => n.key !== this.selectedNode.key);
    } else {
      this.rootNodes = this.rootNodes.filter(n => n.key !== this.selectedNode.key);
    }
    switch (dragPos) {
      case 0:
        targetNode.addChildren([this.selectedNode]);
        this.resetNodeLevel(targetNode);
        break;
      case -1:
      case 1:
        const tIndex = dragPos === 1 ? 1 : 0;
        if (targetParent) {
          targetParent.addChildren([this.selectedNode], targetParent.children.indexOf(targetNode) + tIndex);
          const parentNode = this.selectedNode.getParentNode();
          if (parentNode) {
            this.resetNodeLevel(parentNode);
          }
        } else {
          const targetIndex = this.rootNodes.indexOf(targetNode) + tIndex;
          // Insert root node.
          this.rootNodes.splice(targetIndex, 0, this.selectedNode);
          this.rootNodes[targetIndex].parentNode = null;
          this.rootNodes[targetIndex].level = 0;
        }
        break;
    }
    // flush all nodes
    this.rootNodes.forEach(child => {
      if (!child.treeService) {
        child.service = treeService;
      }
      this.refreshDragNode(child);
    });
  }

  /**
   * emit Structure
   * eventName
   * node
   * event: MouseEvent / DragEvent
   * dragNode
   */
  formatEvent(eventName: string, node: TreeNodeModel | null, event: MouseEvent | DragEvent | null): NzFormatEmitEvent {
    const emitStructure: NzFormatEmitEvent = {
      eventName: eventName,
      node: node,
      event: event
    };
    switch (eventName) {
      case 'dragstart':
      case 'dragenter':
      case 'dragover':
      case 'dragleave':
      case 'drop':
      case 'dragend':
        Object.assign(emitStructure, { dragNode: this.getSelectedNode() });
        break;
      case 'click':
      case 'dblclick':
      case 'contextmenu':
      case 'touchstart':
        Object.assign(emitStructure, { selectedKeys: this.selectedNodeList });
        Object.assign(emitStructure, { nodes: this.selectedNodeList });
        Object.assign(emitStructure, { keys: this.selectedNodeList.map(n => n.key) });
        break;
      case 'check':
        const checkedNodeList = this.getCheckedNodeList();

        Object.assign(emitStructure, { checkedKeys: checkedNodeList });
        Object.assign(emitStructure, { nodes: checkedNodeList });
        Object.assign(emitStructure, { keys: checkedNodeList.map(n => n.key) });
        break;
      case 'search':
        Object.assign(emitStructure, { matchedKeys: this.getMatchedNodeList() });
        Object.assign(emitStructure, { nodes: this.getMatchedNodeList() });
        Object.assign(emitStructure, { keys: this.getMatchedNodeList().map(n => n.key) });
        break;
      case 'expand':
        Object.assign(emitStructure, { nodes: this.expandedNodeList });
        Object.assign(emitStructure, { keys: this.expandedNodeList.map(n => n.key) });
        break;
    }
    return emitStructure;
  }

  ngOnDestroy(): void {
    this.triggerEventChange$.complete();
  }
}
