export interface IMyFormState {
  submitSuccess: boolean;
  submitFailed: boolean;
  MyFiles: IUploadingFile[];
  productInEdit: any;
  stateHolder: number;
}

export interface IUploadingFile {
  FileName: string;
  LinkToFile: string;
  UploadSuccessful: boolean;
  ErrorMessage: string;
}
