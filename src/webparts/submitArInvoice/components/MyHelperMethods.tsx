import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';
import { InvoiceActionRequiredRequestType, IInvoiceActionRequired } from './interface/IInvoiceActionRequired';
import { InvoiceActionResponseStatus, MyContentTypes } from './enums/MyEnums';
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { MyLists } from './enums/MyLists';
import { IInvoiceAction } from './interface/InvoiceItem';


interface IMyKendoFilter {
  field: string;
  operator: string;
  value: any;
}

interface IMyQueryParameters {
  FilterField: string;
  FilterValue: string;
}

export const ConvertQueryParamsToKendoFilter = (fields: IMyQueryParameters[]) => {
  let output = [];
  let queryParams = new UrlQueryParameterCollection(window.location.href);

  for (let index = 0; index < fields.length; index++) {
    const element: IMyQueryParameters = fields[index];
    let myParmField = queryParams.getValue(element.FilterField);
    let myParmValue = queryParams.getValue(element.FilterValue);

    if (myParmField != undefined && myParmField != undefined) {
      let kendoFilter: IMyKendoFilter = {
        field: myParmField,
        operator: "contains",
        value: myParmValue
      };

      output.push(kendoFilter);
    }
  }

  return output;
};

const S4 = () => {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

/**
 * Generate a random GUID string.
 */
export const BuildGUID = () => {
  return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
};


/**
 * Create a task for an invoice.
 * @param assignedToId Users who's approval is required.
 * @param requestType What type of request this is.
 * @param arRequestId AR Request ID
 * @param arInvoiceId AR Invoice ID (optional)
 */
export const CreateInvoiceAction = async (assignedToId: number, requestType: InvoiceActionRequiredRequestType, arRequestId: number, arInvoiceId?: number, message?: string) => {
  let newAction: IInvoiceActionRequired = {
    AR_x0020_Invoice_x0020_RequestId: arRequestId,
    AR_x0020_InvoiceId: arInvoiceId,
    Title: 'Approval Required',
    AssignedToId: assignedToId,
    Body: message ? message : 'Approval Required',
    Request_x0020_Type: requestType,
    Response_x0020_Status: InvoiceActionResponseStatus.Waiting
  };

  return await sp.web.lists.getByTitle(MyLists.InvoiceActionRequired)
    .items
    .add(newAction)
    .then(async result => {
      return await result.item.get();
    });
};

export const UpdateAccountDetails = (invoices: any, newAccount: Array<any>, setStateCallBack: Function) => {
  let data = invoices.data;

  for (let index = 0; index < newAccount.length; index++) {
    const currentAccount = newAccount[index];

    let invoiceIndex = invoices.data
      .findIndex(p => p.ID === (p.ContentTypeId === MyContentTypes["AR Invoice Document Item"] ? currentAccount.InvoiceID : currentAccount.RequestId));

    if (invoiceIndex >= 0) {
      let accountIndex = data[invoiceIndex].AccountDetails.findIndex(p => p.ID === currentAccount.ID);
      if (accountIndex >= 0) {
        data[invoiceIndex].AccountDetails[accountIndex] = {
          ...data[invoiceIndex].AccountDetails[accountIndex],
          Account_x0020_Code: currentAccount.GLCode,
          Amount: currentAccount.Amount,
          HST_x0020_Taxable: currentAccount.HSTTaxable
        };
      }
      else {
        // When adding a new account there is a left over empty account.  
        // This bad object is always in the first index... I can't find where it's getting set in time to release this program. 
        // Check for it here and remove it if found. 
        let badIndex = data[invoiceIndex].AccountDetails.findIndex(p => p.Amount === "" && p.GLCode === "");
        if (badIndex >= 0) {
          data[invoiceIndex].AccountDetails.splice(badIndex, 1);
        }

        // If accountIndex is not found that means we are adding the first account or a new account.
        data[invoiceIndex].AccountDetails.push({
          Account_x0020_Code: currentAccount.GLCode,
          Amount: currentAccount.Amount,
          HST_x0020_Taxable: currentAccount.HSTTaxable,
          HST: currentAccount.HST,
          Total_x0020_Invoice: currentAccount.TotalInvoice
        });
      }
    }
  }

  setStateCallBack(data);
};

/**
 * 
 * @param response Approve or Deny.
 * @param invoiceAction IInvoiceAction object.  Must contain ID property. 
 */
export const SendApprovalResponse = async (response: InvoiceActionResponseStatus, invoiceAction: IInvoiceAction) => {
  console.log('Sending Approval');
  console.log(response);
  console.log(invoiceAction);
};
