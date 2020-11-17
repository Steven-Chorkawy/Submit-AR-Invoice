import { InvoiceActionRequestTypes, InvoiceActionResponseStatus } from '../enums/MyEnums';

export interface IInvoiceActionRequired {
  AR_x0020_InvoiceId?: number;
  ReceivedARRequestId?: number;
  AR_x0020_Invoice_x0020_RequestId?: number;
  Title: string;
  AssignedToId: number;
  Body: string;
  Request_x0020_Type: InvoiceActionRequestTypes;
  Response_x0020_Message?: string;
  Response_x0020_Status: InvoiceActionResponseStatus;
  Response_x0020_Summary?: string;
}