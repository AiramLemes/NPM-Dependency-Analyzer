<template>
  <div class="row">
    <!-- Columna 1 - Ocupa 6 columnas -->
    <div class="col-8">
      <div class="row">
        <div class="col-11">
          <q-select
            filled
            v-model="model"
            use-input
            label="Search for graph nodes ..."
            use-chips
            multiple
            input-debounce="0"
            @new-value="createValue"
            @add="emitModel"
            @remove="emitModel"
            :options="filterOptions"
            @filter="filterFn"
          />
        </div>
      </div>
    </div>

    <div class="col-2">
      <q-select
        filled
        v-model="upLevel"
        :options="levelOptions"
        label="Up Level"
        class="q-select-levels"
        @update:model-value="emitModel"
      />
    </div>

    <!-- Columna 4 - Ocupa 2 columnas -->
    <div class="col-2">
      <q-select
        filled
        v-model="downLevel"
        :options="levelOptions"
        label="Down Level"
        class="q-select-levels"
        @update:model-value="emitModel"
      />
    </div>
  </div>
</template>

<script>
import {ref} from 'vue';

let stringOptions = [];
const filterOptions = ref(stringOptions);

export default {
  props: {
    optionDependencies: Array,
  },
  data() {
    return {
      model: [],
      upLevel: 1,
      downLevel: 1,
      filterOptions,
      timer: null,
      levelOptions: [1, 2, 3, 4, 5, 6, 7],
    };
  },

  mounted() {
    this.emitter.on('clicked-node', (nodeLabel) => {

        if (!this.model.includes(nodeLabel)) {
          this.model.push(nodeLabel);
          this.emitModel();
        }
    });
  },


  watch: {
    optionDependencies(newValue) {
      stringOptions = newValue;
    },

    upLevel: 'emitModel',
    downLevel: 'emitModel',
  },
  methods: {
    createValue(val, done) {
      if (val.length > 2) {
        if (!stringOptions.includes(val)) {
          done(val, 'add-unique');
        }
      }
    },

    filterFn(val, update) {
      update(() => {
        if (val === '') {
          filterOptions.value = stringOptions;
        } else {
          const needle = val.toLowerCase();
          filterOptions.value = stringOptions.filter(
            (v) => v.toLowerCase().indexOf(needle) > -1
          );
        }
      });
    },

    emitModel() {

      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        const args = {
          p1: this.model,
          p2: this.upLevel,
          p3: this.downLevel
        };
        this.emitter.emit('filter-strings', args)
        this.timer = null;
      }, 200);
    },

    eraseSearch() {
      this.model = [];
    }
  },
};
</script>

<style scoped>
.row {
  display: flex;
  align-items: center !important;
}

.q-select-levels {
  width: 100%;
  padding-right: 10px;
}

button {
  width: 10%;
  height: 100%;
  padding: 15px;
}
</style>
