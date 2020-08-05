export interface IInvoiceActionRequired {
  AR_x0020_InvoiceId?: number;
  AR_x0020_Invoice_x0020_RequestId: number;
  Title: string;
  AssignedTo: number;
  Description: string;
  Request_x0020_Type: InvoiceActionRequiredRequestType;
  Response_x0020_Message?: string;
  Response_x0020_Status: InvoiceActionRequiredResponseStatus;
  Response_x0020_Summary?: string;
};

export enum InvoiceActionRequiredRequestType {
  DepartmentApprovalRequired = 'Department Approval Required',
  AccountantApprovalRequired = 'Accountant Approval Required',
  EditRequired = 'Edit Required',
};

export enum InvoiceActionRequiredResponseStatus {
  Approved = 'Approved',
  Rejected = 'Rejected',
  Denied = 'Denied',
  Waiting = 'Waiting'
};
