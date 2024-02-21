<template>
  <div class="q-pa-md">
    <SearchBar
      :option-dependencies="listOfDependencies"
      ref="searchBar"
    ></SearchBar>

    <div class="graph-container">

      <div ref="mynetwork" class="graph"></div>

      <div ref="secondNetwork" class="graph hidden">
      </div>

    </div>

    <q-page-sticky position="top-right" :offset="[58, 110]" scroll="false">
      <q-toggle
        v-model="viewAllNodes"
        color="green"
        label="Show all nodes"
        @click="showNodesHandler()"
      />
    </q-page-sticky>

    <q-page-sticky position="top-right" :offset="[50, 150]" scroll="false">
      <q-toggle
        v-model="reRenderGraph"
        color="green"
        label="Re--render graph"
        @click="reRenderGraphFunc()"
      />
    </q-page-sticky>

    <q-page-sticky
      position="bottom-right"
      :offset="[30, 20]"
      scroll="false"
      class="q-ma-md q-btn-sm"
    >
      <q-btn icon="center_focus_weak" color="primary" @click="fitNetwork()"/>
    </q-page-sticky>
  </div>
</template>

<script>
import FilePersistence from 'src/persistent/FilePersistence';
import {DependencyExtractor} from 'src/tools/DependenciesHandler';
import {DataSet} from 'vis-data/peer';
import {Network} from 'vis-network';
import NotifyHandler from 'src/tools/NotifyHandler';
import SearchBar from 'components/SearchBar.vue';
import {ref} from 'vue';

const filePersistence = new FilePersistence();
const notify = new NotifyHandler();
let DPObject = new DependencyExtractor(null, null);
let upLevel = 1;
let downLevel = 1;


const downLevelColors = [
  '#FFC3C3',
  '#FF8A8A',
  '#FF6D6D',
  '#FF3333',
  '#E60000',
  '#B40000',
  '#8A0000',
];

const upLevelColors = [
  '#C3FFC3',
  '#8AFF8A',
  '#6DFF6D',
  '#33FF33',
  '#17FF17',
  '#00B400',
  '#008A00',
];

const initialNodeColor = '#ff8000';


export default {
  components: {SearchBar},
  props: {
    edArray: Array,
    ndArray: Array,
  },
  data() {
    return {
      network: null,
      nodesArray: new DataSet([]),
      edgesArray: new DataSet([]),
      viewAllNodes: true,
      message: '',
      initialNodesIds: [],
      processedNodes: [],
      data: null,
      selectedNodeColor: '#ffeaa7',
      reRenderGraph: false,
      newNetwork: null,
      options: {
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
        },

        edges: {
          color: {
            inherit: false,
          },
          arrows: {
            to: {enabled: true, scaleFactor: 1, type: 'arrow'},
          },
        },
      },
      listOfDependencies: ref([]),
    };
  },
  mounted() {
    this.emitter.on('focus-node', nodeId => {
      this.focusOnNode(nodeId);
    })
    this.emitter.on('filter-strings', args => {
      this.search(args.p1, args.p2, args.p3);
    })
  },

  methods: {

    reRenderGraphFunc() {

      const firstNetwork = this.$refs.mynetwork;
      const secondNetwork = this.$refs.secondNetwork;

      if (this.reRenderGraph) {

        const addedNodes = new Set();
        const addedEdges = new Set();

        const updatedNodes = [];
        const updatedEdges = [];

        this.processedNodes.forEach((nodeId) => {
          if (!addedNodes.has(nodeId)) {
            const nodeData = this.network.body.nodes[nodeId];
            updatedNodes.push({
              id: nodeId,
              label: nodeData.options.label,
              shape: 'box',
              color: nodeData.options.color.background
            });
            addedNodes.add(nodeId);
          }

          const connectedEdges = this.network.getConnectedEdges(nodeId);
          connectedEdges.forEach((edgeId) => {
            if (!addedEdges.has(edgeId)) {
              const edgeData = this.network.body.edges[edgeId];
              updatedEdges.push({
                id: edgeId,
                from: edgeData.fromId,
                to: edgeData.toId,
              });
              addedEdges.add(edgeId);
            }
          });
        });

        const newData = {
          nodes: new DataSet(updatedNodes),
          edges: new DataSet(updatedEdges),
        };

        this.newNetwork = new Network(this.$refs.secondNetwork, newData, this.options);
        this.initialNodesIds.forEach(initialNodeId => {
          const initialNode = updatedNodes.find(node => node.id == initialNodeId);

          if (initialNode) {
            this.newNetwork.body.nodes[initialNodeId].setOptions({
              borderWidth: 20,
            });
          }
        });
        firstNetwork.classList.add('hidden');
        secondNetwork.classList.remove('hidden');

    } else {
      secondNetwork.classList.add('hidden');
      firstNetwork.classList.remove('hidden');
    }
},



    setOptionsToInitialNodes(color, nodeId) {
      this.network.body.nodes[nodeId].setOptions({
        borderWidth: 20,
        color: {
          background: color,
          border: color,
        },
      });
    },

    showNodesHandler() {
      if (this.data != null) {
        if (this.viewAllNodes) {
          DPObject.showAllNodes();
        } else {
          if (this.processedNodes.length > 0) {
            DPObject.showAllNodes(); // Ensure all nodes are well hidden
            DPObject.hideNodes(this.processedNodes);
          }
        }
      }
    },

    getDependencyFiles(dependecyHashList) {
      const dependencyFiles = [];

      if (dependecyHashList.length == 0) {
        notify.showMessage('info', 'You have to select at least one file !!');
      } else {
        dependecyHashList.forEach((hash) => {
          dependencyFiles.push(filePersistence.getJSONFile(hash));
        });
        return dependencyFiles;
      }
    },

    getGraphContent(dependecyFiles) {

      this.$refs.searchBar.eraseSearch();

      this.edgesArray = new DataSet([]);

      this.nodesArray.clear();
      this.edgesArray.clear();
      this.data = {
        nodes: this.nodesArray,
        edges: this.edgesArray,
      };

      this.network = new Network(this.$refs.mynetwork, this.data, this.options);

      DPObject = new DependencyExtractor(this.data, this.network);
      DPObject.loadDependencies(this.getDependencyFiles(dependecyFiles));

      this.initialNodesIds = DPObject.initialNodesIds;
      this.initialNodesIds.forEach(nodeId => {
        this.setOptionsToInitialNodes(initialNodeColor, nodeId);
      });


      this.network.fit();

      this.network.on('select', (node) => {
        if (node.nodes.length !== 0) {
          const selectedNode = this.network.body.nodes[node.nodes[0]];
          this.emitter.emit('clicked-node', selectedNode.options.label)
        }
      });

      this.listOfDependencies = Array.from(DPObject.nodeNames);
    },

    fitNetwork() {
      let moveToOptions = {
        position: {x: 0, y: 0},
        scale: 0.5,
        animation: {
          duration: 100,
          easingFunction: 'easeInOutQuad',
        },
      };
      this.network.fit(moveToOptions);
      this.newNetwork.fit(moveToOptions);
    },

    resetAllNodeColors() {
      const allNodes = this.network.body.nodes;

      Object.keys(allNodes).forEach((nodeId) => {
        const node = allNodes[nodeId];
        if (this.initialNodesIds.includes(nodeId)) {
          this.setOptionsToInitialNodes(initialNodeColor, nodeId);
        } else
          node.setOptions({color: '#97c2fc'});

      });
      DPObject.showAllNodes()
      this.network.redraw();
    },


    setDepthLevel(node, upLevel, downLevel) {
      let processedNodesUp = new Set();
      let processedNodesDown = new Set();
      let nodesUp = [node];
      let nodesDown = [node];


      for (let indexUp = 0; indexUp < upLevel; indexUp++) {
        let nextNodesUp = [];

        nodesUp.forEach((currentNodeId) => {
          const connectedEdgesUp =
            this.network.getConnectedEdges(currentNodeId);
          connectedEdgesUp.forEach((edgeId) => {
            const networkEdgeUp = this.network.body.edges[edgeId];

            if (!processedNodesUp.has(networkEdgeUp.fromId)) {
              const connectedNodeUp =
                this.network.body.nodes[networkEdgeUp.fromId];

              if (connectedNodeUp.options.color.background !== this.selectedNodeColor) { // Not changing color from searched nodes
                connectedNodeUp.setOptions({color: downLevelColors[indexUp]});
              }
              nextNodesUp.push(networkEdgeUp.fromId);
              processedNodesUp.add(networkEdgeUp.fromId);
            }
          });
        });

        nodesUp = nextNodesUp.slice();
      }


      for (let indexDown = 0; indexDown < downLevel; indexDown++) {
        let nextNodesDown = [];

        nodesDown.forEach((currentNodeId) => {
          const connectedEdgesDown =
            this.network.getConnectedEdges(currentNodeId);

          connectedEdgesDown.forEach((edgeId) => {
            const networkEdgeDown = this.network.body.edges[edgeId];

            if (!processedNodesDown.has(networkEdgeDown.toId)) {
              const connectedNodeDown =
                this.network.body.nodes[networkEdgeDown.toId];
              if (connectedNodeDown.options.color.background !== this.selectedNodeColor) { // Not changing color from searched nodes
                connectedNodeDown.setOptions({
                  color: upLevelColors[indexDown],
                });
              }


              nextNodesDown.push(networkEdgeDown.toId);
              processedNodesDown.add(networkEdgeDown.toId);
            }
          });
        });

        nodesDown = nextNodesDown.slice();

        const selectedNode = this.network.body.nodes[node];
        if (this.initialNodesIds.includes(selectedNode.id)) {
          this.setOptionsToInitialNodes(this.selectedNodeColor, selectedNode.id);
        } else {
          selectedNode.setOptions({color: this.selectedNodeColor});
        }

      }

      this.network.redraw();
      return Array.from(processedNodesDown).concat(
        Array.from(processedNodesUp)
      );
    },

    search(listOfStrings, upLevelOption, downLevelOption) {
      upLevel = upLevelOption;
      downLevel = downLevelOption;
      this.processedNodes = [];
      this.resetAllNodeColors();

      if (this.network != null) {
        if (listOfStrings.length == 0) {
          DPObject.showAllNodes();
          this.emitter.emit('selected-nodes', []);
        } else {
          if (listOfStrings.length != 0) {
            const nodes = DPObject.filterGraphByStrings(listOfStrings);
            this.emitter.emit('selected-nodes', nodes);
            nodes.forEach((node) => {
              this.processedNodes = this.processedNodes.concat(
                this.setDepthLevel(node.id, upLevel, downLevel)
              );
            });

            this.reRenderGraphFunc();
          }

          this.showNodesHandler();
        }
      } else {
        const notify = new NotifyHandler();
        notify.showMessage('error', 'You need to render at least one file !');
      }
    },

    focusOnNode(nodeId) {
      this.network.focus(nodeId, {
        scale: 1, // Escala del zoom
        animation: {
          duration: 100,
          easingFunction: 'easeInOutQuad',
        },
      });
    },
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}

.graph {
  width: 99%;
  height: 80vh;
  margin-top: 33px;
}

.q-btn {
  width: 30%;
  height: 30%;
}

.overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 99%;
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;

}

.overlay-content {
  padding: 20px;
  border: 2px solid #ff0000; /* Borde rojo para mayor visibilidad */
  background-color: #ffffff; /* Fondo blanco */
  z-index: 2; /* Asegúrate de que esté sobre el grafo original */
}
</style>
