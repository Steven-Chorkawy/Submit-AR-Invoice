/**
 * Default Invoice Status values.
 * The values are set in AR Invoices document library as a Choice column.
 */
export enum InvoiceStatus {
  'Submitted' = 'Submitted',
  'Approved' = 'Approved',
  'Rejected' = 'Rejected',
  'Accountant Approval Required' = 'Accountant Approval Required',
  'Hold for Department' = 'Hold for Department',
  'Hold for Finance' = 'Hold for Finance',
  'Ready to Invoice' = 'Ready to Invoice',
  'Entered into GP' = 'Entered into GP',
  'Completed' = 'Completed',
  'Cancelled' = 'Cancelled'
}

/**
 * These are the status that an InvoiceAction can have.
 * InvoiceAction = approval or any other action needed by a user.
 */
export enum InvoiceActionResponseStatus {
  Approved = 'Approved',
  Rejected = 'Rejected',
  Denied = 'Denied',
  Waiting = 'Waiting'
}

/**
 * These are the possible request types (Request_x0020_Type) that an Invoice Action can have. 
 * 
 * * Here are the values copied directly from the SharePoint column settings as of November 26 2020. 
 * * Department Approval Required
 * * Accountant Approval Required
 * * Accounting Clerk2 Approval Required
 * * Edit Required
 * * Cancel Request
 */
export enum InvoiceActionRequestTypes {
  DepartmentApprovalRequired = 'Department Approval Required',
  AccountantApprovalRequired = 'Accountant Approval Required',
  AccountingClerkApprovalRequired = 'Accounting Clerk2 Approval Required',
  EditRequired = 'Edit Required',
  CancelRequest = 'Cancel Request'
}

export enum MyGridStrings {
  DateFilter = '{0: MM/dd/yyyy}',
}

export enum MyContentTypes {
  'AR Request List Item' = '0x01009B60AAD03E8EEE4781EB045A4B5C2F35',
  'AR Invoice Document Item' = '0x010100199615C6D9FF66478377323A08EB946A',
}
