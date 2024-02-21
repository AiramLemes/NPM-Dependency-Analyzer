import { Dialog, LocalStorage } from 'quasar';
import { computeSHA256Hash } from 'src/tools/HashTool';
import NotifyHandler from 'src/tools/NotifyHandler';
import { FilePersistenceInterface, FileData } from './FilePersistenceInterface';

const notify = new NotifyHandler();

class FilePersistence implements FilePersistenceInterface {

  async processFiles(fileList: File[]) {
    const processedFileList: {
      fileName: any;
      selected: boolean;
      hash: string;
    }[] = [];

    const processFile = (file: File) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
          try {
            const text = event.target!!.result!!.toString();
            const data = JSON.parse(text);

            const hash = await computeSHA256Hash(text);

            if (this.isFileUplodaded(hash)) {
              notify.showMessage(
                'info',
                'Some json files have been removed to skip duplicated data!!'
              );
            } else {
                const fileName = data.name + '@' + data.version;
                if (this.isFileNameUploaded(fileName)) {
                  if (await this.confirmDialog(fileName)) {
                    this.removeFileByName(fileName);
                    const newFile: FileData = {
                      fileName: fileName,
                      selected: false,
                      hash: hash,
                    };
                    this.addFile(hash, text);
                    processedFileList.push(newFile);

                    notify.showMessage(
                      'success',
                      'File successfully updated!'
                    );
                  }
                }
                else {
                  const newFile: FileData = {
                    fileName: fileName,
                    selected: false,
                    hash: hash,
                  };
                  this.addFile(hash, text);
                  processedFileList.push(newFile);
                }
              }
          } catch (error) {
            console.error(error);
            notify.showMessage(
              'error',
              'Some error ocurred trying to read: ' + file.name
            );
          }

          resolve();
        };

        reader.readAsText(file);
      });
    };

    return Promise.all(fileList.map(processFile)).then(() => {
      const updatedDependencyList = this.getFiles().concat(processedFileList);
      this.setFileList(updatedDependencyList);
      return updatedDependencyList;
    });
  }

  addFile(hash: string, fileAsText: string) {
    LocalStorage.set(hash, fileAsText);
  }

  removeFile(fileHash: string) {
    LocalStorage.remove(fileHash);
    const list = this.getFiles();
    const index = list.findIndex(
      (item: FileData) => item.hash === fileHash
    );
    list.splice(index, 1);
    this.setFileList(list);
  }

  getJSONFile(hash: string) {
    return JSON.parse(LocalStorage.getItem(hash)!!);
  }

  getFiles(){
    const consistencyFiles: string | null =
      LocalStorage.getItem('DependencyFileList');
    return consistencyFiles == null
      ? new Array()
      : JSON.parse(consistencyFiles);
  }

  setFileList(dependenciesList: FileData[]) {
    if (dependenciesList.length != 0) {
      LocalStorage.set('DependencyFileList', JSON.stringify(dependenciesList));
    } else {
      LocalStorage.remove('DependencyFileList');
    }
  }

  isFileUplodaded(hash: string) {
    return LocalStorage.getItem(hash) === null ? false : true;
  }

  confirmDialog(projectName: string): Promise<boolean> {
    return new Promise((resolve) => {
      Dialog.create({
        dark: false,
        title: 'Project Name Conflict',
        message: `A project with the name "${projectName}" already exists. Loading this JSON may overwrite existing data. Are you sure you want to proceed?`,
        cancel: true,
        persistent: true
      }).onOk(() => {
        resolve(true);
      }).onCancel(() => {
        resolve(false);
      });
    });
  }

  isFileNameUploaded(fileName: string) {
    return this.getFiles().some((fileData: FileData) => fileData.fileName == fileName);
  }

  removeFileByName(fileName: string) {
    this.removeFile(this.getFiles().find((fileData: FileData) => fileData.fileName === fileName).hash);
  }
}

export default FilePersistence;
