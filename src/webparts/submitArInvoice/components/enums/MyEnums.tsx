/**
 * Default Invoice Status values.
 * The values are set in AR Invoices document library as a Choice column.
 */
export enum InvoiceStatus {
  'Submitted' = 'Submitted',
  'Approved' = 'Approved',
  'Rejected' = 'Rejected',
  'Accountant Approval Required' = 'Accountant Approval Required',
  'Hold' = 'Hold',
  'Ready to Invoice' = 'Ready to Invoice',
  'Entered into GP' = 'Entered into GP',
  'Completed' = 'Completed'
}

export enum InvoiceActionResponseStatus {
  Approved = 'Approved',
  Rejected = 'Rejected',
  Denied = 'Denied',
  Waiting = 'Waiting'
}

export enum MyGridStrings {
  DateFilter = '{0: MM/dd/yyyy}',
}

export enum MyContentTypes {
  'AR Request List Item' = '0x01009B60AAD03E8EEE4781EB045A4B5C2F35',
  'AR Invoice Document Item' = '0x010100199615C6D9FF66478377323A08EB946A',
}
