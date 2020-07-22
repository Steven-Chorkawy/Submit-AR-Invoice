export interface IMyFormState {
  submitSuccess: boolean;
  submitFailed: boolean;
  MyFiles: IUploadingFile[];
  productInEdit: any;
  stateHolder: number;
  MiscCustomerDetails?: string;
}

export interface IUploadingFile {
  FileName: string;
  LinkToFile: string;
  UploadSuccessful: boolean;
  ErrorMessage: string;
}
