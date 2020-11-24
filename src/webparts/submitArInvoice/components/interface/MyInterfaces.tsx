import { InvoiceActionResponseStatus, InvoiceActionRequestTypes } from '../enums/MyEnums';

export interface IARInvoiceAccount {
    Title?: any;
    Account_x0020_Code: any;
    Amount: any;
    HST_x0020_Taxable: boolean;
    AR_x0020_InvoiceId: number;
    AR_x0020_Invoice_x0020_RequestId: number;
    ReceivedARRequest?: number;
}

export interface IInvoiceActionRequired {
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

export interface IPersonField {
    Id: number;
    // Users Email
    EMail: string;
    // Users Name.  Last, First
    Title: string;
}

export interface ICustomerField {
    Customer_x0020_Name: string;
    CustomerDetails: string;
    Id?: number;
}

export interface IUpdateLookupField {
    results: Array<number>;
}

export interface IRelatedAttachment {
    ARInvoiceId?: number;
    AR_x0020_Invoice_x0020_RequestId: number;
    ID: number;
    Id: number;
    ServerRedirectedEmbedUri: string;
    ServerRedirectedEmbedUrl: string;
    Title: string;
}

/**
 * Structure for Invoice Actions.
 */
export interface IInvoiceAction {
    ID: number;
    Id: number;
    ContentTypeId: string;
    AuthorId: number;
    Author?: IPersonField;
    Created: Date;
    EditorId: number;
    Modified: Date;

    AR_x0020_InvoiceId?: number;
    AR_x0020_Invoice_x0020_RequestId: number;
    AssignedToId: number;
    AssignedTo?: IPersonField;
    Title: string;
    Body: number;
    DueDate?: Date;
    StartDate?: Date;
    Request_x0020_Type: string;
    Response_x0020_Message?: string;
    Response_x0020_Status: InvoiceActionResponseStatus;
    Response_x0020_Summary?: string;
    Status: string;
}

/**
 * Response that we get from SharePoint for Invoice Requests items and Invoices items
 */
export interface IInvoiceQueryItem {
    Id: number;
    ID: number;
    FileSystemObjectType: number;       // Do we really need this?
    ServerRedirectedEmbedUri?: string;
    ServerRedirectedEmbedUrl?: string;
    ContentTypeId: string;              // This tells us if this object is an invoice or an invoice request.
    Title: string;
    StrTitle: string;
    Type_x0020_of_x0020_Request: string;
    Invoice_x0020_Number: string;
    Department: string;
    Date: Date;
    Requested_x0020_ById: number;
    Requires_x0020_Authorization_x0020_ById: Array<number>;
    Urgent: boolean;
    CustomerId: number;
    Customer_x0020_PO_x0020_Number: string;
    Invoice_x0020_Details: string;
    Accountant_x0020_ApprovalId: number;
    Requires_x0020_Accountant_x0020_ApprovalId: number;
    RequiresAccountingClerkTwoApprovId: number;
    Completed_x0020_ApprovalId: number;
    Requires_x0020_Completed_x0020_ApprovalId: number;
    Batch_x0020_Number: string;
    Invoice_x0020_Status: string;
    Standard_x0020_Terms: string;
    AccountDetailsId: Array<any>;// TODO: Change type of any to number or object.
    MiscCustomerName: string;
    MiscCustomerDetails: string;
    DirtyField: Date;
    AR_x0020_RequestId: number;
    Created: Date;
    AuthorId: number;
    Modified: Date;
    EditorId: number;
    Requires_x0020_Department_x0020_Id: Array<number>;
}

/**
 * This is the result that we will be returning to be used through out the app.
 */
export interface IInvoiceItem extends IInvoiceQueryItem {

    CancelRequests: Array<IInvoiceCancelRequest>;

    AccountDetails: Array<any>;

    Actions: Array<IInvoiceAction>;

    RelatedAttachments: Array<IRelatedAttachment>;

    Customer: ICustomerField;

    RequiresAuthorizationBy?: any;

    Requested_x0020_By?: IPersonField;

    Requires_x0020_Department_x0020_?: Array<IPersonField>;

    Requires_x0020_Accountant_x0020_?: IPersonField;

    RequiresAccountingClerkTwoApprov?: IPersonField;

    // This is used by Kendo components to show or hide more details.
    expanded: boolean;
}


export interface IInvoiceUpdateItem {
    Id: number;
    ID: number;
    Department: string;
    Date: Date;
    Requested_x0020_ById: number;
    // Users who's approval is required.
    Requires_x0020_Department_x0020_Id: IUpdateLookupField;
    Urgent: boolean;
    CustomerId: number;
    Customer_x0020_PO_x0020_Number: string;
    Invoice_x0020_Details: string;
    // Accountant_x0020_ApprovalId: number;
    // Requires_x0020_Accountant_x0020_ApprovalId: number;
    // Completed_x0020_ApprovalId: number;
    // Requires_x0020_Completed_x0020_ApprovalId: number;
    // Batch_x0020_Number: string;
    //Invoice_x0020_Status: string;
    //Standard_x0020_Terms: string;
    //AccountDetailsId: Array<any>;// TODO: Change type of any to number or object.
    MiscCustomerName: string;
    MiscCustomerDetails: string;
    DirtyField: Date;
    //AR_x0020_RequestId: number;
}


/**
 * CancelRequest that is attached to the invoice output object.
 */
export interface IInvoiceCancelRequest {
    Requested_x0020_By: IPersonField;
    Id: number;
    ID: number;

    ContentTypeId: string;

    Title: string;

    Invoice_x0020_NumberId: number;
    AR_x0020_Invoice_x0020_RequestId: number;

    Requested_x0020_ById: number;
    Requester_x0020_Comments: number;
    Request_x0020_Denied_x0020_ById?: number;
    Request_x0020_Denied_x0020_By_x0?: Date;
    Requires_x0020_Approval_x0020_FrId?: number;
    Modified: Date;
    Created: Date;
}

export interface IMySaveResult {
    success: boolean;
    message: string;
}

export interface ISPUser {
    Email: string;
    Id: number;
    LoginName: string;
    Title: string;
}