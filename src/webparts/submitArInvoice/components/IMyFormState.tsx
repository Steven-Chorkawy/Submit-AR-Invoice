export interface IMyFormState {
  submitSuccess: boolean;
  submitFailed: boolean;
  MyFiles: IUploadingFile[];
  productInEdit: any;
}

export interface IUploadingFile {
  FileName: string;
  UploadSuccessful: boolean;
  ErrorMessage: string;
}
