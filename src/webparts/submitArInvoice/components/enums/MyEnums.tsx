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

export enum MyGridStrings {
  DateFilter = '{0: MM/dd/yyyy}',
}
