<template>
  <div style="width: 100%">
    <div class="row q-pa-md">
      <q-file
        v-model="qfiles"
        @input="onFileChange"
        :disable="isFileProcessing"
        label="Pick dependecy json"
        filled
        multiple
        accept=".json"
        clearable

      />
    </div>

    <div class="row q-pa-md">
      <q-list dense separator bordered padding class="rounded-borders my-list">
        <q-item
          v-for="dependency in sortedDependencies"
          :key="dependency.hash"
          @click="dependency.selected = !dependency.selected"
          v-ripple
          clickable
        >
          <q-item-section avatar>
            <q-checkbox
              v-model="dependency.selected"
              :disable="true"
              color="primary"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ dependency.fileName }}</q-item-label>
          </q-item-section>

          <q-item-section avatar>
            <q-btn
              @click.stop="deleteDependencyFile(dependency)"
              flat
              dense
              color="primary"
              icon="delete"
            ></q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script lang="ts">
import FilePersistence from 'src/persistent/FilePersistence';
import {defineComponent} from 'vue';
import {FileData} from 'src/persistent/FilePersistenceInterface';

const filePersistence = new FilePersistence();

export default defineComponent({
  name: 'FileUploadList',

  data() {
    return {
      dependencyBundle: [] as FileData[],
      isFileProcessing: false,
      qfiles: [],
    };
  },
  props: {
    send_graph_inf: Number,
  },

  mounted() {
    this.dependencyBundle = filePersistence.getFiles();
    this.isFileProcessing = false;
  },

  computed: {
    sortedDependencies: function () {
      return this.dependencyBundle
        .slice()
        .sort((a: FileData, b: FileData) =>
          a.selected === b.selected ? 0 : a.selected ? -1 : 1
        );
    },
  },

  methods: {
    deleteDependencyFile(dependency: FileData) {
      const fileHash = dependency.hash;
      filePersistence.removeFile(fileHash);
      const index = this.dependencyBundle.findIndex(
        (item) => item.hash === fileHash
      );
      this.dependencyBundle.splice(index, 1);
    },

    getDependencyFiles() {
      const dependencyFileHashList: string[] = [];
      this.dependencyBundle.filter((file) => {
        if (file.selected) {
          dependencyFileHashList.push(file.hash);
        }
      });
      return dependencyFileHashList;
    },

    async onFileChange(event: { target: any }) {
      this.isFileProcessing = true; //lock q-file
      const inputElement = event.target;
      const fileList: File[] = Array.from(inputElement.files);
      try {
        this.dependencyBundle = await filePersistence.processFiles(fileList);
      } catch (error) {
        console.error(error);
      } finally {
        this.isFileProcessing = false;
        this.qfiles = []; // Erase qfile files after processing
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.my-list {
  width: 100%;
  height: 350px;
  overflow-y: auto;
}

.q-item {
  height: min-content;
}

.q-icon {
  align-self: self-end;
}

.button {
  margin-left: auto;
}

.q-file {
  width: 100%;
  align-content: center;
}

@media screen and (max-width: 968px) {
  .my-list {
    height: 250px; /* Cambiar el estilo para pantallas más grandes */
  }
}
</style>
