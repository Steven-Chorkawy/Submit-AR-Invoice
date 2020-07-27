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

/** End PnP Imports */

interface IInvoiceDataProviderProps {
  dataState: any;
  filterState?: any;

  onDataReceived: any;
  onARRequestDataReceived: any;

  statusDataState: any;
  siteUsersDataState: any;
  onStatusDataReceived: any;
  onSiteUsersDataReceived: any;
  currentUserDataState: any;
  onCurrentUserDataReceived: any;
}


/***********************************
 *
 * 0 = G/L Accounts.
 * 1 = Approval Responses.
 * 2 = Related Attachments.
 * 3 = Files from RelatedAttachments.
 *      This is used to get the URL to the files.
 * 4 = Cancel Requests.
 * 5 = AR Invoice Documents.
 *
 ***********************************/
enum ARLoadQuery {
  GLAccounts = 0,
  ApprovalResponses = 1,
  RelatedAttachments = 2,
  FilesRelatedAttachments = 3,
  CancelRequests = 4,
  ARInvoiceDocuments = 5,
};

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


class InvoiceDataProvider extends React.Component<IInvoiceDataProviderProps, any> {
  constructor(props) {
    super(props);
  }

  public pending = '';
  public lastSuccess = '';
  public lastForceGUID = '';

  public requestARRequestsIfNeeded = () => {
    // If pending is set OR dateSate === lastDataState
    if (this.pending || toODataString(this.props.dataState) === this.lastSuccess) {
      return;
    }

    this.pending = toODataString(this.props.dataState);

    sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
      .items
      .select('*, Customer/Customer_x0020_Name, Customer/ID')
      .expand('Customer')
      .getAll()
      .then(async response => {
        this.lastSuccess = this.pending;
        this.pending = '';

        let filteredResponse = filterBy(response, this.props.filterState);

        // Apply Kendo grids filters.
        var processedResponse = process(filteredResponse, this.props.dataState);

        // Hold the list of invoice IDs that will be used to pull related accounts.
        var invoiceIds = [];                // filter for accounts
        var idsForApproval = [];            // filter for approval requests. 
        var idsForRelatedAttachments = [];  // filter for related attachments. 
        var idsForCancelRequests = [];      // filter for cancel requests.
        var idsForARDocuments = [];

        // Iterate through processedResponse instead of response because if you don't this will generate a URL that over
        // 2000 characters long.
        // That is too big for SharePoint to handle.
        for (let index = 0; index < processedResponse.data.length; index++) {
          const element = processedResponse.data[index];
          invoiceIds.push(`AR_x0020_Invoice_x0020_Request/ID eq ${element.ID}`);
          idsForApproval.push(`InvoiceID eq '${element.ID}'`);
          idsForRelatedAttachments.push(`AR_x0020_Invoice_x0020_Request/ID eq ${element.ID}`);
          idsForCancelRequests.push(`AR_x0020_Invoice_x0020_Request/ID eq ${element.ID}`);

          idsForARDocuments.push(`AR_x0020_RequestId eq ${element.ID}`);

          processedResponse.data[index].Date = new Date(processedResponse.data[index].Date);
          processedResponse.data[index].Created = new Date(processedResponse.data[index].Created);
        }

        Promise.all([
          sp.web.lists.getByTitle(MyLists["AR Invoice Accounts"])
            .items
            .filter(invoiceIds.join(' or '))
            .get(),
          sp.web.lists.getByTitle('Approval Requests Sent')
            .items
            .filter(idsForApproval.join(' or '))
            .get(),
          sp.web.lists.getByTitle('RelatedInvoiceAttachments')
            .items
            .filter(idsForRelatedAttachments.join(' or '))
            .getAll(),
          //TODO: How can I filter these results? I don't need every file.
          sp.web.getFolderByServerRelativePath(MyLists["Related Invoice Attachments"])
            .files(),
          sp.web.lists.getByTitle(MyLists["Cancel Invoice Request"])
            .items
            .select('*, Requested_x0020_By/EMail, Requested_x0020_By/Title')
            .expand('Requested_x0020_By')
            .filter(idsForCancelRequests.join(' or '))
            .getAll(),
          sp.web.lists.getByTitle(MyLists["AR Invoices"])
            .items
            .filter(idsForARDocuments.join(' or '))
            .getAll(),
        ])
          .then((values) => {
            /***********************************
             *
             * 0 = G/L Accounts.
             * 1 = Approval Responses.
             * 2 = Related Attachments.
             * 3 = Files from RelatedAttachments.
             *      This is used to get the URL to the files.
             * 4 = Cancel Requests.
             * 5 = AR Invoice Documents.
             *
             ***********************************/
            // Using each of the accounts that we found we will not attach them to the invoice object.
            for (let index = 0; index < processedResponse.data.length; index++) {
              processedResponse.data[index];
              

              if (values[ARLoadQuery.ARInvoiceDocuments].filter(f => Number(f.AR_x0020_RequestId) === processedResponse.data[index].ID).length > 0) {
                debugger;
                processedResponse.data[index] = values[ARLoadQuery.ARInvoiceDocuments].filter(f => Number(f.AR_x0020_RequestId) === processedResponse.data[index].ID)[0];
              }

              processedResponse.data[index].AccountDetails = values[ARLoadQuery.GLAccounts].filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === processedResponse.data[index].ID) || [];
              processedResponse.data[index].Approvals = values[ARLoadQuery.ApprovalResponses].filter(f => Number(f.InvoiceID) === processedResponse.data[index].ID) || [];
              processedResponse.data[index].RelatedAttachments = values[ARLoadQuery.RelatedAttachments].filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === processedResponse.data[index].ID) || [];
              processedResponse.data[index].CancelRequests = values[ARLoadQuery.CancelRequests].filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === processedResponse.data[index].ID) || [];

              // Add ServerDirectUrl if required.
              processedResponse.data[index].RelatedAttachments.map(relatedAttachments => {
                if (relatedAttachments.ServerRedirectedEmbedUrl === "") {
                  var url = values[3].find(f => f.Title === relatedAttachments.Title).ServerRelativeUrl;
                  relatedAttachments.ServerRedirectedEmbedUrl = url;
                  relatedAttachments.ServerRedirectedEmbedUri = url;
                }
              });
            }
            // response.map(invoice => {
            //   if (values[ARLoadQuery.ARInvoiceDocuments].filter(f => Number(f.AR_x0020_RequestId) === invoice.ID).length > 0) {
            //     debugger;
            //     invoice = values[ARLoadQuery.ARInvoiceDocuments].filter(f => Number(f.AR_x0020_RequestId) === invoice.ID)[0];
            //   }

            //   invoice.AccountDetails = values[ARLoadQuery.GLAccounts].filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === invoice.ID) || [];
            //   invoice.Approvals = values[ARLoadQuery.ApprovalResponses].filter(f => Number(f.InvoiceID) === invoice.ID) || [];
            //   invoice.RelatedAttachments = values[ARLoadQuery.RelatedAttachments].filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === invoice.ID) || [];
            //   invoice.CancelRequests = values[ARLoadQuery.CancelRequests].filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === invoice.ID) || [];

            //   // Add ServerDirectUrl if required.
            //   invoice.RelatedAttachments.map(relatedAttachments => {
            //     if (relatedAttachments.ServerRedirectedEmbedUrl === "") {
            //       var url = values[3].find(f => f.Title === relatedAttachments.Title).ServerRelativeUrl;
            //       relatedAttachments.ServerRedirectedEmbedUrl = url;
            //       relatedAttachments.ServerRedirectedEmbedUri = url;
            //     }
            //   });
            // });
            debugger;

            // This is something from Kendo demos.
            if (toODataString(this.props.dataState) === this.lastSuccess) {
              this.props.onARRequestDataReceived.call(undefined, {
                // Add the filtered, sorted data.
                data: processedResponse.data,
                // Add the total amount of records found prior to filters and sorts being applied.
                total: processedResponse.total
              });
            } else {
              this.requestARRequestsIfNeeded();
            }
          });
      });
  }


  public requestDataIfNeeded = () => {

    // If pending is set OR dateSate === lastDataState
    if (this.pending || toODataString(this.props.dataState) === this.lastSuccess) {
      return;
    }

    this.pending = toODataString(this.props.dataState);

    sp.web.lists.getByTitle(MyLists["AR Invoices"])
      .items
      .select('*, Customer/Customer_x0020_Name')
      .expand('Customer')
      .getAll()
      .then(async response => {
        this.lastSuccess = this.pending;
        this.pending = '';


        let filteredResponse = filterBy(response, this.props.filterState);

        // Apply Kendo grids filters.
        var processedResponse = process(filteredResponse, this.props.dataState);

        // Hold the list of invoice IDs that will be used to pull related accounts.
        var invoiceIds = [];
        var idsForApproval = [];
        var idsForRelatedAttachments = [];
        var idsForCancelRequests = [];

        // Iterate through processedResponse instead of response because if you don't this will generate a URL that over
        // 2000 characters long.
        // That is too big for SharePoint to handle.
        for (let index = 0; index < processedResponse.data.length; index++) {
          const element = processedResponse.data[index];
          invoiceIds.push(`AR_x0020_InvoiceId eq ${element.ID}`);
          idsForApproval.push(`InvoiceID eq '${element.ID}'`);
          idsForRelatedAttachments.push(`ARInvoice/ID eq ${element.ID}`);
          idsForCancelRequests.push(`Invoice_x0020_Number/ID eq ${element.ID}`);

          processedResponse.data[index].Date = new Date(processedResponse.data[index].Date);
          processedResponse.data[index].Created = new Date(processedResponse.data[index].Created);
        }

        //#region Query the required account details for this invoice.

        Promise.all([
          sp.web.lists.getByTitle('AR Invoice Accounts')
            .items
            .filter(invoiceIds.join(' or '))
            .get(),
          sp.web.lists.getByTitle('Approval Requests Sent')
            .items
            .filter(idsForApproval.join(' or '))
            .get(),
          sp.web.lists.getByTitle('RelatedInvoiceAttachments')
            .items
            .filter(idsForRelatedAttachments.join(' or '))
            .getAll(),
          //TODO: How can I filter these results? I don't need every file.
          sp.web.getFolderByServerRelativePath("RelatedInvoiceAttachments")
            .files(),
          sp.web.lists.getByTitle('Cancel Invoice Request')
            .items
            .select('*, Requested_x0020_By/EMail, Requested_x0020_By/Title')
            .expand('Requested_x0020_By')
            .filter(idsForCancelRequests.join(' or '))
            .getAll()
        ])
          .then((values) => {
            /***********************************
             *
             * 0 = G/L Accounts.
             * 1 = Approval Responses.
             * 2 = Related Attachments.
             * 3 = Files from RelatedAttachments.
             *      This is used to get the URL to the files.
             * 4 = Cancel Requests.
             *
             ***********************************/

            // Using each of the accounts that we found we will not attach them to the invoice object.
            response.map(invoice => {

              invoice.AccountDetails = values[0].filter(f => Number(f.AR_x0020_InvoiceId) === invoice.ID) || [];
              invoice.Approvals = values[1].filter(f => Number(f.InvoiceID) === invoice.ID) || [];
              invoice.RelatedAttachments = values[2].filter(f => Number(f.ARInvoiceId) === invoice.ID) || [];
              invoice.CancelRequests = values[4].filter(f => Number(f.Invoice_x0020_NumberId) === invoice.ID) || [];

              // Add ServerDirectUrl if required.
              invoice.RelatedAttachments.map(relatedAttachments => {
                if (relatedAttachments.ServerRedirectedEmbedUrl === "") {
                  var url = values[3].find(f => f.Title === relatedAttachments.Title).ServerRelativeUrl;
                  relatedAttachments.ServerRedirectedEmbedUrl = url;
                  relatedAttachments.ServerRedirectedEmbedUri = url;
                }
              });
            });

            // This is something from Kendo demos.
            if (toODataString(this.props.dataState) === this.lastSuccess) {

              this.props.onDataReceived.call(undefined, {
                // Add the filtered, sorted data.
                data: processedResponse.data,
                // Add the total amount of records found prior to filters and sorts being applied.
                total: processedResponse.total
              });
            } else {
              this.requestDataIfNeeded();
            }
          });
      });
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

    // Query any methods required here.
    //this.requestDataIfNeeded();
    this.requestARRequestsIfNeeded();
    this.requestStatusData();
    this.requestSiteUsers();

    if (this.props.onCurrentUserDataReceived !== undefined) {
      this.requestCurrentUser();
    }

    return this.pending && <LoadingPanel />;
  }
}



export { InvoiceDataProvider };
