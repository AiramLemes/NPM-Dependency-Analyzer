<template>
  <main class="q-pa-md">
    <div class="row">
      <div class="col-md-3">
        <div class="row">
          <FileUploadList ref="fileUploadList"></FileUploadList>
        </div>

        <div class="row q-pa-sm">
          <q-btn
            color="white"
            text-color="black"
            label="Render"
            class="q-mt-sm q-button"
            @click="
              this.$refs.visNetworkGraph.getGraphContent(
                this.$refs.fileUploadList.getDependencyFiles()
              ), this.$refs.nodeInfo.clear()
            "
          ></q-btn>
        </div>

        <div class="row q-pa-sm">
          <NodeInformation
            ref="nodeInfo"
          ></NodeInformation>
        </div>

      </div>
      <div class="col text-center">
        <VisNetworkGraph
          ref="visNetworkGraph"
        ></VisNetworkGraph>
      </div>
    </div>
  </main>
</template>

<script>
import {defineComponent} from 'vue';
import FileUploadList from 'src/components/FileUploadList.vue';
import VisNetworkGraph from 'components/VisNetworkGraph.vue';
import NodeInformation from 'src/components/NodeInformation.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {
    VisNetworkGraph,
    FileUploadList,
    NodeInformation,
  },

});
</script>

<!--<style scoped>-->
<style scoped>
.q-button {
  width: 100%;
}
</style>
