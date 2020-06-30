export interface IMyFormState {
  submitSuccess: boolean;
  submitFailed: boolean;
  MyFiles: IUploadingFile[];
}

export interface IUploadingFile {
  FileName: string;
  UploadSuccessful: boolean;
  ErrorMessage: string;
}
