import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';
import { InvoiceActionRequiredRequestType, IInvoiceActionRequired, InvoiceActionRequiredResponseStatus } from './interface/IInvoiceActionRequired';
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { MyLists } from './enums/MyLists';


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
export const CreateInvoiceAction = async (assignedToId: number, requestType: InvoiceActionRequiredRequestType, arRequestId: number, arInvoiceId?: number) => {
  let newAction: IInvoiceActionRequired = {
    AR_x0020_Invoice_x0020_RequestId: arRequestId,
    AR_x0020_InvoiceId: arInvoiceId,
    Title: 'Approval Required',
    AssignedToId: assignedToId,
    Body: 'Approval Required',
    Request_x0020_Type: requestType,
    Response_x0020_Status: InvoiceActionRequiredResponseStatus.Waiting
  };

  return await sp.web.lists.getByTitle(MyLists.InvoiceActionRequired)
    .items
    .add(newAction)
    .then(async result => {
      return await result.item.get();
    });
}
