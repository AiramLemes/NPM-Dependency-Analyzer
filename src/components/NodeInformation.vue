<template>
  <q-card class="my-card">
    <q-card-section>
      <p style="min-height: 80px" class="overflow-ellipsis" v-html="formattedData"></p>
    </q-card-section>

    <q-card-actions align="around">
      <q-btn flat @click="goBack">Back</q-btn>
      <q-btn flat @click="focusOnNode">Focus</q-btn>
      <q-btn flat @click="goNext">Next</q-btn>
    </q-card-actions>
  </q-card>
</template>

<script>
import NotifyHandler from 'src/tools/NotifyHandler';

const notify = new NotifyHandler();
const initialNodeInformation = `
  <strong>ID:</strong> N/A<br/>
  <strong>Name:</strong> N/A<br/>
  <strong>Version:</strong> N/A<br/>
  <strong>Project Names:</strong> N/A
`;

export default {
  data() {
    return {
      nodes: [],
      index: 0,
      formattedData: initialNodeInformation,
    };
  },
  mounted() {
    this.emitter.on('selected-nodes', selectedNodes => {
      if (selectedNodes.length == 0) {
        this.nodes = [];
        this.formattedData = initialNodeInformation;
      } else {
        this.getNodes(selectedNodes);
      }
    });

  },

  methods: {
    getNodes(nodeInfo) {
      this.nodes = [];
      nodeInfo.forEach((node) => {
        this.nodes.push(node);
      });

      this.formatData();
    },

    clear() {
      this.formattedData = initialNodeInformation;
    },

    formatData() {

      const currentNode = this.nodes[this.index];
      const atIndex = currentNode.label.indexOf('@');
      const secondAtIndex = currentNode.label.indexOf('@', atIndex + 1);
      let name;
      let version;
      if (atIndex !== -1 && secondAtIndex !== -1) {
        name = currentNode.label.substring(0, secondAtIndex);
        version = currentNode.label.substring(secondAtIndex + 1);
      } else {
        const nodeLabelParts = currentNode.label.split('@');
        name = nodeLabelParts[0] || 'N/A';
        version = nodeLabelParts[1] || 'N/A';
      }
      const projectNames = Array.from(currentNode.parentNodesNames).join(', ');
      this.formattedData = `
        <strong>ID:</strong> ${currentNode.id}<br/>
        <strong>Name:</strong> ${name}<br/>
        <strong>Version:</strong> ${version}<br/>
        <strong>Project Names:</strong> ${projectNames}
      `;
    },

    goBack() {
      if (this.nodes.length == 0) {
        notify.showMessage(
          'info',
          'Please render and search for a node first.'
        );
      } else {
        this.index > 0 ? this.index-- : (this.index = this.nodes.length - 1);
        this.formatData();
      }
    },

    goNext() {
      if (this.nodes.length == 0) {
        notify.showMessage(
          'info',
          'Please render and search for a node first.'
        );
      } else {
        this.index < this.nodes.length - 1 ? this.index++ : (this.index = 0);
        this.formatData();
      }
    },

    focusOnNode() {
      if (this.nodes.length == 0) {
        notify.showMessage(
          'info',
          'Please render and search for a node first.'
        );
      } else {
        this.$nextTick(() => {
          this.emitter.emit('focus-node', this.nodes[this.index].id)
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.my-card {
  width: 100%;
}

.q-btn {
  color: #1976d2;
}

.overflow-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
