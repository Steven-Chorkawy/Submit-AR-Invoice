import { InvoiceActionResponseStatus } from '../enums/MyEnums';

export interface IInvoiceActionRequired {
  AR_x0020_InvoiceId?: number;
  AR_x0020_Invoice_x0020_RequestId: number;
  Title: string;
  AssignedToId: number;
  Body: string;
  Request_x0020_Type: InvoiceActionRequiredRequestType;
  Response_x0020_Message?: string;
  Response_x0020_Status: InvoiceActionResponseStatus;
  Response_x0020_Summary?: string;
}

export enum InvoiceActionRequiredRequestType {
  DepartmentApprovalRequired = 'Department Approval Required',
  AccountantApprovalRequired = 'Accountant Approval Required',
  AccountingClerk2ApprovalRequired = 'Accounting Clerk2 Approval Required',
  EditRequired = 'Edit Required',
}
