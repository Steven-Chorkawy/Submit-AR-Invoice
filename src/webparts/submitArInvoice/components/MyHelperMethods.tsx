import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';
import { InvoiceActionRequestTypes, InvoiceActionResponseStatus, MyContentTypes } from './enums/MyEnums';
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { MyLists } from './enums/MyLists';
import { IInvoiceAction, IInvoiceActionRequired } from './interface/MyInterfaces';
import { ISPUser } from './interface/MyInterfaces';


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

export const BuildFilterForInvoiceID = (invoices: any[]): any => {
  let filterObject = { logic: 'or', filters: [] };

  for (let index = 0; index < invoices.length; index++) {
    const invoice = invoices[index];
    let filter: IMyKendoFilter = {
      field: 'ID',
      operator: 'eq',
      value: invoice.ID
    };
    filterObject.filters.push(filter);
  }

  return filterObject;
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
 */
export const CreateInvoiceAction = async (assignedToId: number, requestType: InvoiceActionRequestTypes, arRequestId: number, message?: string) => {
  let newAction: IInvoiceActionRequired = {
    AR_x0020_Invoice_x0020_RequestId: arRequestId,
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
      return await result.item
        .select('*, AssignedTo/EMail, AssignedTo/Title, Author/EMail, Author/Title')
        .expand('AssignedTo, Author')
        .get();
    });
};

export const UpdateAccountDetails = (invoices: any, newAccount: any[], setStateCallBack: Function) => {
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
export const SendApprovalResponse = async (response: string, comment: string, invoiceAction: IInvoiceAction) => {
  // TODO: Check if Id is present.
  if (invoiceAction) {
    return await sp.web.lists.getByTitle(MyLists.InvoiceActionRequired).items.getById(invoiceAction.Id)
      .update({
        Response_x0020_Status: response,
        Response_x0020_Message: comment
      });
  }
};

export const GetDepartments = async (): Promise<any[]> => {
  let field: any = await sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).fields.getByTitle('Department').select('Choices').get();
  return field.Choices;
};

export const GetStandardTerms = async (): Promise<any[]> => {
  let field: any = await sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).fields.getByInternalNameOrTitle('Standard_x0020_Terms').select('Choices').get();
  return field.Choices;
};

/**
 * Build a URL to access a document. 
 * @param documentTitle Title of the document.
 * @param documentLibrary Name of the Document Library.  Default MyLists["Related Invoice Attachments"].
 */
export const BuildURLToDocument = async (documentTitle: string, documentLibrary: string = MyLists["Related Invoice Attachments"]): Promise<string> => {
  return `${await (await sp.web.get()).Url}/${documentLibrary}/${encodeURI(documentTitle)}?csf=1&web=1`;
};

/**
 * Get a URL to a newly uploaded file. 
 * @param element IFile object from the upload component.
 * @param invoiceId ID of the invoice to add an attachment to.
 * @param invoices A list of all invoices found in the components state.
 * @param callBack Takes an updated version of invoices as it's only parameter.
 */
export const GetURLForNewAttachment = (element: any, invoiceId: number, invoices: any[], callBack: Function): void => {
  const ALERT_MESSAGE = 'Cannot upload your attachment at this moment.  Please contact helpdesk@clarington.net';
  if (!element || !invoiceId || !invoices || !callBack) {
    alert(ALERT_MESSAGE);
  }

  sp.web.lists.getByTitle(MyLists["Related Invoice Attachments"])
    .items
    .filter(`AR_x0020_Invoice_x0020_Request/ID eq ${invoiceId}`)
    .getAll()
    .then(newestMetadata => {
      BuildURLToDocument(element.name).then(url => {
        let thisNewFileMetadata = newestMetadata.find(f => f.Title === element.name);
        // ! Important !
        // * This is why this method is here.
        // * This line is how we get a URL to a newly uploaded document.
        thisNewFileMetadata.ServerRedirectedEmbedUrl = url;
        thisNewFileMetadata.ServerRedirectedEmbedUri = url;

        let invoiceIndex = invoices.findIndex(f => f.Id === invoiceId);
        let dataState = invoices;

        dataState[invoiceIndex].RelatedAttachments.push(thisNewFileMetadata);

        // Pass the entire invoice state (with the new attachment) back to the parent method. 
        callBack(dataState);
      });
    });
};

//#region Get User Methods
export const GetUserByEmail = async (email: string): Promise<ISPUser> => {
  try {
    return await sp.web.siteUsers.getByEmail(email).get();
  } catch (error) {
    console.error('Error getting Id of user by Email ', error);
    throw error;
  }
};

export const GetUsersByEmail = async (emails: string[]): Promise<ISPUser[]> => {
  let output: ISPUser[] = [];

  for (let index = 0; index < emails.length; index++) {
    const email = emails[index];
    output.push(await GetUserByEmail(email));
  }

  return output;
};

export const GetUserById = async (userId): Promise<ISPUser> => {
  if (userId > 0 && !isNaN(parseInt(userId))) {
    try {
      return await sp.web.siteUsers.getById(userId).get();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
};

export const GetUserByLoginName = async (loginName: string): Promise<ISPUser> => {
  return await sp.web.siteUsers.getByLoginName(loginName).get();
};

export const GetUsersByLoginName = async (users: Array<any>): Promise<Array<ISPUser>> => {
  let returnOutput: Array<ISPUser> = [];
  for (let index = 0; index < users.length; index++) {
    const user = users[index];
    returnOutput.push(await GetUserByLoginName(user.loginName));
  }
  return returnOutput;
};

/**
* Get user profile details.
* @param loginName A Users LoginName
* @param callBack Call Back method is passed the users profile.
*/
export const GetUserProfile = async (loginName: string, callBack: Function) => {
  sp.profiles.getPropertiesFor(loginName).then(userProfileRes => {
    // This converts UserProfileProperties from an array of key value pairs [{Key:'', Value: ''},{Key:'', Value: ''}]
    // Into an array of objects [{'Key': 'Value'}, {'Key: 'Value'}]
    let props = {};
    userProfileRes.UserProfileProperties.map(p => {
      props[p.Key] = p.Value;
    });
    userProfileRes['Props'] = { ...props };

    callBack(userProfileRes);
  });
};
//#endregion Get User Methods

