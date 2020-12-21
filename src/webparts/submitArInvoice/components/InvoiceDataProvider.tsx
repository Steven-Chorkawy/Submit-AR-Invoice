import * as React from 'react';
import * as ReactDom from 'react-dom';

/** Start Kendo Imports */
import { toODataString, process, filterBy } from '@progress/kendo-data-query';
/** End Kendo Imports */

/** Start PnP Imports */
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";
import { IFile } from '@pnp/sp/files';
import { MyLists } from './enums/MyLists';
import { filter } from '@progress/kendo-data-query/dist/npm/transducers';
import { MyContentTypes } from './enums/MyEnums';
import { IInvoiceItem } from './interface/MyInterfaces';
import { context } from '@progress/kendo-licensing/dist/validate-package';
import { IWebInfo } from '@pnp/sp/webs';
import { BuildURLToDocument } from './MyHelperMethods';

/** End PnP Imports */

interface IInvoiceDataProviderProps {
  dataState: any;
  filterState?: any;

  onARRequestDataReceived: any;

  statusDataState: any;
  siteUsersDataState: any;
  onStatusDataReceived: any;
  onSiteUsersDataReceived: any;
  currentUserDataState: any;
  onCurrentUserDataReceived: any;
}

interface IInvoiceDataProviderState {
  processedResponse: IProcessedResponse;
}

interface IProcessedResponse {
  data: Array<IInvoiceItem>;
}

enum ARLoadQuery {
  GLAccounts = 0,               // G/L Accounts.
  InvoiceActions = 1,           // Approval Responses.
  RelatedAttachments = 2,       // Related Attachments.
  // ? Maybe we can remove this as well?
  FilesRelatedAttachments = 3,  // Files from RelatedAttachments.
  ARInvoiceLink = 4             // AR Invoice Documents.
}

class LoadingPanel extends React.Component {
  public render() {
    const loadingPanel = (
      <div className="k-loading-mask">
        <span className="k-loading-text">Loading</span>
        <div className="k-loading-image"></div>
        <div className="k-loading-color"></div>
      </div>
    );

    const gridContent = document && document.querySelector('.k-grid-content');
    return gridContent ? ReactDom.createPortal(loadingPanel, gridContent) : loadingPanel;
  }
}

// TODO: Test that this function works by calling it in another method.
// TODO: Replace the logic in the original calling method with this function.
/**
 * Run the query that populate all the invoices.
 */
export const QueryInvoiceData = ({ filterState, dataState }, callBack: Function) => {

  const includeString = `*,
    Requested_x0020_By/Id,
    Requested_x0020_By/Title,
    Requested_x0020_By/EMail,
    Requires_x0020_Department_x0020_/Id,
    Requires_x0020_Department_x0020_/Title,
    Requires_x0020_Department_x0020_/EMail,
    Requires_x0020_Accountant_x0020_/Id,
    Requires_x0020_Accountant_x0020_/Title,
    Requires_x0020_Accountant_x0020_/EMail,
    RequiresAccountingClerkTwoApprov/Id,
    RequiresAccountingClerkTwoApprov/Title,
    RequiresAccountingClerkTwoApprov/EMail,
    RelatedAttachments/Title,
    RelatedAttachments/Id,
    RelatedAttachments/ID`;

  const expandString = `
    Requested_x0020_By,
    Requires_x0020_Department_x0020_,
    Requires_x0020_Accountant_x0020_,
    RequiresAccountingClerkTwoApprov,
    RelatedAttachments`;

  // Same as 'includeString' but with slight differences.
  const includeARDocumentString = `*,
  Requires_x0020_Accountant_x0020_Approval/ID,
  Requires_x0020_Accountant_x0020_Approval/Title,
  Requires_x0020_Accountant_x0020_Approval/EMail,
  RequiresAccountingClerkTwoApproval/ID,
  RequiresAccountingClerkTwoApproval/Title,
  RequiresAccountingClerkTwoApproval/EMail,
  Requires_x0020_Authorization_x0020_By/Id`;

  // Same as 'expandString' but with slight differences.
  const expandStringARDocumentString = `
  Requires_x0020_Accountant_x0020_Approval,
  RequiresAccountingClerkTwoApproval,
  Requires_x0020_Authorization_x0020_By
  `;

  sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
    .items
    .select(includeString)
    .expand(expandString)
    .getAll()
    .then(async response => {
      console.log('raw Res');
      console.log(response);
      let filteredResponse = filterBy(response, filterState);

      // Apply Kendo grids filters.
      let processedResponse = process(filteredResponse, dataState);
      debugger;
      // Hold the list of invoice IDs that will be used to pull related accounts.
      var invoiceIds = [];                // filter for accounts
      var idsForARDocuments = [];

      // Iterate through processedResponse instead of response because if you don't this will generate a URL that over
      // 2000 characters long.
      // That is too big for SharePoint to handle.
      for (let index = 0; index < processedResponse.data.length; index++) {
        const element = processedResponse.data[index];
        invoiceIds.push(`AR_x0020_Invoice_x0020_Request/ID eq ${element.ID}`);
        idsForARDocuments.push(`AR_x0020_RequestId eq ${element.ID}`);


        // Format data of processedResponse.
        processedResponse.data[index].Date = new Date(processedResponse.data[index].Date);
        processedResponse.data[index].Created = new Date(processedResponse.data[index].Created);

        // If CustomerId isn't present and MisCustomerName isn't null that means the user has entered a random customer.
        // By building a Customer object out of the misc customer info it will be much easier to display real customers and mis customers together.
        if ((processedResponse.data[index].CustomerId === undefined || processedResponse.data[index].CustomerId === null) && processedResponse.data[index].MiscCustomerName !== null) {
          processedResponse.data[index].Customer = {
            "Customer_x0020_Name": processedResponse.data[index].MiscCustomerName,
            "CustomerDetails": processedResponse.data[index].MiscCustomerDetails
          };
        }
      }

      Promise.all([
        //ARLoadQuery.GLAccounts = 0
        sp.web.lists.getByTitle(MyLists["AR Invoice Accounts"])
          .items
          .filter(invoiceIds.join(' or '))
          .get(),
        //ARLoadQuery.InvoiceActions = 1
        sp.web.lists.getByTitle(MyLists.InvoiceActionRequired)
          .items
          .select('*, AssignedTo/EMail, AssignedTo/Title, Author/EMail, Author/Title')
          .expand('AssignedTo, Author')
          .filter(invoiceIds.join(' or '))
          .get(),
        //ARLoadQuery.RelatedAttachments = 2
        sp.web.lists.getByTitle('RelatedInvoiceAttachments')
          .items
          .filter(invoiceIds.join(' or '))
          .getAll(),
        //TODO: How can I filter these results? I don't need every file.
        //ARLoadQuery.FilesRelatedAttachments = 3
        sp.web.getFolderByServerRelativePath(MyLists["Related Invoice Attachments"])
          .files(),
        //ARLoadQuery.ARInvoiceLink = 4
        sp.web.getFolderByServerRelativePath(MyLists["AR Invoices"]).files()
      ])
        .then(async (values) => {
          console.log('Raw Query Res');
          console.log(values);

          // Using each of the accounts that we found we will not attach them to the invoice object.
          for (let index = 0; index < processedResponse.data.length; index++) {
            processedResponse.data[index].AccountDetails = values[ARLoadQuery.GLAccounts]
              .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === processedResponse.data[index].ID) || [];

            processedResponse.data[index].Actions = values[ARLoadQuery.InvoiceActions]
              .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === processedResponse.data[index].ID) || [];

            processedResponse.data[index].RelatedAttachments = values[ARLoadQuery.RelatedAttachments]
              .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === processedResponse.data[index].ID) || [];

            // * !!! Important !!!
            // * This is how we get our links to documents. 
            if (processedResponse.data[index].RelatedAttachments && processedResponse.data[index].RelatedAttachments.length > 0) {
              for (let relatedAttachmentsIndex = 0; relatedAttachmentsIndex < processedResponse.data[index].RelatedAttachments.length; relatedAttachmentsIndex++) {
                let documentUrl = await BuildURLToDocument(processedResponse.data[index].RelatedAttachments[relatedAttachmentsIndex].Title);
                processedResponse.data[index].RelatedAttachments[relatedAttachmentsIndex].ServerRedirectedEmbedUrl = documentUrl;
                processedResponse.data[index].RelatedAttachments[relatedAttachmentsIndex].ServerRedirectedEmbedUri = documentUrl;
              }
            }

            // Add the customer data.
            // The reason I'm doing this here and not in the extend is because some fields from the customer list weren't working!!!
            if (processedResponse.data[index].CustomerId) {
              let customer = await sp.web.lists.getByTitle(MyLists.Customers).items.getById(processedResponse.data[index].CustomerId).get();
              processedResponse.data[index].Customer = customer;
            }

            // Convert dates from strings to dates.... thanks SharePoint.
            processedResponse.data[index].Date = new Date(processedResponse.data[index].Date);
            processedResponse.data[index].Created = new Date(processedResponse.data[index].Created);
          }

          /**
           * Here we want to return all the invoices that we queried. 
           * That includes the 'processed' ones and non 'processed' ones. 
           * 
           * The processed ones have links to their documents and account codes 
           * where as the non processed ones only have the invoice metadata. 
           * 
           * The callBack method will then need to process our whatever we send them one more time to ensure 
           * the gird or list only display records that have all their data.
           * 
           */
          
          callBack(processedResponse);
        });
    });
};

export class InvoiceDataProvider extends React.Component<IInvoiceDataProviderProps, IInvoiceDataProviderState> {
  constructor(props) {
    super(props);
  }

  public pending = '';
  public lastSuccess = '';
  public lastForceGUID = '';

  // TODO: Update this method so it uses QueryInvoiceData().
  public requestARRequestsIfNeeded = () => {
    // If pending is set OR dateSate === lastDataState
    if (this.pending || toODataString(this.props.dataState) === this.lastSuccess) {
      return;
    }

    this.pending = toODataString(this.props.dataState);
    
    QueryInvoiceData(
      {
        filterState: this.props.filterState,
        dataState: this.props.dataState
      },
      invoices => {
        this.lastSuccess = this.pending;
        this.pending = '';
        this.props.onARRequestDataReceived(invoices);
      }
    );
  }

  public requestStatusData = () => {
    if (this.props.statusDataState.length > 0) {
      return;
    }

    sp.web.lists
      .getByTitle('AR Invoices')
      .fields
      .getByInternalNameOrTitle('Invoice_x0020_Status')
      .select('Choices')
      .get()
      .then(response => {
        let output: any = response;

        if (output.hasOwnProperty('Choices')) {
          this.props.onStatusDataReceived.call(undefined, output.Choices);
        }
        else {
          this.props.onStatusDataReceived.call(undefined, []);
        }
      });
  }

  public requestSiteUsers = () => {
    if (this.props.siteUsersDataState.length > 0) {
      return;
    }

    sp.web.siteUsers()
      .then(siteUsers => {
        // siteUsers() returns a list of users and groups.
        // by filtering out "users" who do not have a UserPrincipalName I can return a list of only users and no groups.
        this.props.onSiteUsersDataReceived.call(undefined, siteUsers.filter(user => user.UserPrincipalName != null));
      });
  }

  public requestCurrentUser = () => {
    if (this.props.currentUserDataState != undefined) {
      return;
    }

    sp.web.currentUser.get()
      .then(user => {
        this.props.onCurrentUserDataReceived.call(undefined, user);
      });
  }

  public render() {
    this.requestARRequestsIfNeeded();
    this.requestStatusData();
    this.requestSiteUsers();

    if (this.props.onCurrentUserDataReceived !== undefined) {
      this.requestCurrentUser();
    }

    return this.pending && <LoadingPanel />;
  }
}