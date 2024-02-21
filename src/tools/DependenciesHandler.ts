interface nodeObject {
  id: string;
  label: string;
  group: string;
  shape: string;
  parentNodesNames: Set<string>;
}

interface edgeObject {
  from: string;
  to: string;
}

class Node {
  name: string;
  version: string | null;

  constructor(name: string, version: string | null) {
    this.name = name;
    this.version = version;
  }
}

class DependencyExtractor {
  private data: any;
  private network: any;
  private edgesDictionary: Map<string, edgeObject> = new Map();
  private nodesDictionary: Map<string, nodeObject> = new Map();
  public nodeNames: Set<string> = new Set<string>();
  public initialNodesIds: Array<string> = [];

  constructor(data: any = null, network: any = null) {

    this.data = data;
    this.network = network;

  }


  //FILTERING DE GRAPH

  filterGraphByStrings(listOfStrings: Array<string>, depth: number = 1) {
    let nextNodes = this.filterNodesByStrings(listOfStrings);
    return nextNodes;
  }

  filterNodesByStrings(filterArray: Array<string>) {
    let initialNodes: Array<nodeObject> = [];
    for (const word of filterArray) {
      initialNodes.push(...this.filterNodesByString(word));
    }
    return initialNodes;
  }

  filterNodesByString(filterWord: string) {
    // Return all the nodes with that name or similar name
    let filteredNodes: nodeObject[] = [];

    //to know if we are searching an specific library or all the versions of a library
    const regexPattern = new RegExp('.*@.*', 'i');
    if (
      regexPattern.test(filterWord.toLowerCase())
    ) {
      //it a specific version
      for (const node of this.nodesDictionary.values()) {
        if (
          node.label.toLowerCase() === filterWord.toLowerCase()
        ) {
          filteredNodes.push(node);
        }
      }
    } else {
      //search all the versions of a library
      filteredNodes = this.filterNodesByStringRegEx(filterWord)
    }
    return filteredNodes
  }

  filterNodesByStringRegEx(filterWord: string) {
    // Return all the nodes with that name with all versions posible
    const regexPattern = new RegExp(`${filterWord}@\\S*$`, 'i');
    let filteredNodes = [];

    for (const node of this.nodesDictionary.values()) {
      if (
        regexPattern.test(node.label.toLowerCase())
      ) {
        filteredNodes.push(node);
      }
    }
    return filteredNodes;
  }

  hideNodes(nodesArray: Array<string>) {
    //functions thats shows in the graph only the nodes of the selected dependency/dependencies
    let updateNodes = [];
    for (const node of this.nodesDictionary.values()) {
      if (nodesArray.includes(node.id)) {
        updateNodes.push({id: node.id, hidden: false});
      } else {
        updateNodes.push({id: node.id, hidden: true});
      }
    }
    this.data.nodes.update(updateNodes);
  }

  showAllNodes() {
    let updateNodes = [];
    for (const node of this.nodesDictionary.values()) {
      updateNodes.push({id: node.id, hidden: false});
    }
    this.data.nodes.update(updateNodes);
  }

  //GETTING DEPENDENCIES METHODS

  createNodes(nodesArray: any[]) {
    this.data.nodes.update(nodesArray);
  }

  createEdges(edgesArray: unknown[]) {
    this.data.edges.update(edgesArray);
  }

  getNodesAndEdgesFromJson(dependencies: { [x: string]: any }, node: Node, initialNode: Node) {
    for (let dependency in dependencies) {
      const details = dependencies[dependency];
      let dependencyStr = '';
      let currentNode: Node;

      //get dependency name depending of version
      if (details.version) {
        dependencyStr = dependency + '@' + details.version;
        currentNode = new Node(dependency, details.version);
      } else {
        dependencyStr = dependency;
        currentNode = new Node(dependency, null);
      }

      let nodeName = node.name + '@' + node.version;
      let codeName = btoa(nodeName);
      let nodeName2 = dependencyStr;
      let codeName2 = btoa(nodeName2);

      let dictKey = codeName + codeName2;
      this.edgesDictionary.set(dictKey, {from: codeName, to: codeName2});
      if (this.nodesDictionary.has(codeName)) {
        // @ts-ignore
        this.nodesDictionary.get(codeName).parentNodesNames.add(initialNode.name + '@' + initialNode.version)
      } else {
        this.nodesDictionary.set(codeName, {
          id: codeName,
          label: nodeName,
          group: '',
          shape: 'box',
          parentNodesNames: new Set()
        });
      }

      if (this.nodesDictionary.has(codeName2)) {
        // @ts-ignore
        this.nodesDictionary.get(codeName2).parentNodesNames.add(initialNode.name + '@' + initialNode.version)
      } else {
        this.nodesDictionary.set(codeName2, {
          id: codeName2,
          label: nodeName2,
          group: '',
          shape: 'box',
          parentNodesNames: new Set()
        });
      }

      this.nodeNames.add(node.name);
      this.nodeNames.add(dependencyStr);

      if (details.dependencies) {
        this.getNodesAndEdgesFromJson(details.dependencies, currentNode, initialNode);
      }
    }
  }


  generateDOTFileFromJSONArray(jsonArray: Array<any>) {
    this.initialNodesIds = [];
    this.edgesDictionary = new Map();
    this.nodesDictionary = new Map();

    for (const json of jsonArray) {
      let initialNode = new Node(json.name, json.version);
      this.getNodesAndEdgesFromJson(json.dependencies, initialNode, initialNode);
      this.initialNodesIds.push(
        btoa(initialNode.name + '@' + initialNode.version)
      );

    }
  }

  async loadDependencies(jsonArray: Array<any>) {
    this.edgesDictionary.clear();
    this.nodesDictionary.clear();
    this.nodeNames.clear();

    this.generateDOTFileFromJSONArray(jsonArray);
    const edgesArray: edgeObject[] = Array.from(this.edgesDictionary.values());
    const nodesArray: nodeObject[] = Array.from(this.nodesDictionary.values());

    let updateNodes = [];
    for (const node of this.nodesDictionary.values()) {
      updateNodes.push({id: node.id, hidden: false});
    }
    this.data.nodes.update(updateNodes);

    this.createNodes(nodesArray);
    this.createEdges(edgesArray);
  }
}

export { Node, DependencyExtractor };
export type { nodeObject, edgeObject };
