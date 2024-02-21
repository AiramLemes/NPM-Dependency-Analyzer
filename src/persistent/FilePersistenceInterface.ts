/* eslint-disable no-unused-vars */
export interface FilePersistenceInterface {
  processFiles(fileList: File[]): Promise<FileData[]>;
  addFile(hash: string, fileAsText: string): void;
  removeFile(fileHash: string): void;
  getJSONFile(hash: string): JSON;
  getFiles(): FileData[];
  setFileList(dependenciesList: FileData[]): void;
  isFileUplodaded(hash: string): boolean;
}

export interface FileData {
  fileName: string;
  selected: boolean;
  hash: string;
}
