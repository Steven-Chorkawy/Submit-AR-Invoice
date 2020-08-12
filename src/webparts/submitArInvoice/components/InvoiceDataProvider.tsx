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
import { IInvoiceItem } from './interface/InvoiceItem';

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

interface IInvoiceDataProviderState {
  processedResponse: IProcessedResponse;
}

interface IProcessedResponse {
  data: Array<IInvoiceItem>;
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
  InvoiceActions = 1,
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


class InvoiceDataProvider extends React.Component<IInvoiceDataProviderProps, IInvoiceDataProviderState> {
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

    const includeString = `*,
    Customer/Customer_x0020_Name,
    Customer/ID,
    Requested_x0020_By/Id,
    Requested_x0020_By/Title,
    Requested_x0020_By/EMail,
    Requires_x0020_Department_x0020_/Id,
    Requires_x0020_Department_x0020_/Title,
    Requires_x0020_Department_x0020_/EMail`;

    const expandString = `
    Customer,
    Requested_x0020_By,
    Requires_x0020_Department_x0020_`;

    sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
      .items
      .select(includeString).expand(expandString)
      .getAll()
      .then(async response => {
        this.lastSuccess = this.pending;
        this.pending = '';

        let filteredResponse = filterBy(response, this.props.filterState);

        // Apply Kendo grids filters.
        this.setState({
          processedResponse: process(filteredResponse, this.props.dataState)
        });

        console.log('processedResponse');
        console.log(this.state.processedResponse);

        // Hold the list of invoice IDs that will be used to pull related accounts.
        var invoiceIds = [];                // filter for accounts
        var idsForARDocuments = [];

        // Iterate through processedResponse instead of response because if you don't this will generate a URL that over
        // 2000 characters long.
        // That is too big for SharePoint to handle.
        for (let index = 0; index < this.state.processedResponse.data.length; index++) {
          const element = this.state.processedResponse.data[index];
          invoiceIds.push(`AR_x0020_Invoice_x0020_Request/ID eq ${element.ID}`);
          idsForARDocuments.push(`AR_x0020_RequestId eq ${element.ID}`);

          // Format data of this.state.processedResponse.
          this.state.processedResponse.data[index].Date = new Date(this.state.processedResponse.data[index].Date);
          this.state.processedResponse.data[index].Created = new Date(this.state.processedResponse.data[index].Created);

          // If CustomerId isn't present and MisCustomerName isn't null that means the user has entered a random customer.
          // By building a Customer object out of the misc customer info it will be much easier to display real customers and mis customers together.
          if ((this.state.processedResponse.data[index].CustomerId === undefined || this.state.processedResponse.data[index].CustomerId === null) && this.state.processedResponse.data[index].MiscCustomerName !== null) {
            this.state.processedResponse.data[index].Customer = {
              "Customer_x0020_Name": this.state.processedResponse.data[index].MiscCustomerName,
              "CustomerDetails": this.state.processedResponse.data[index].MiscCustomerDetails
            };
          }
        }

        Promise.all([
          sp.web.lists.getByTitle(MyLists["AR Invoice Accounts"])
            .items
            .filter(invoiceIds.join(' or '))
            .get(),
          sp.web.lists.getByTitle(MyLists.InvoiceActionRequired)
            .items
            .select('*, AssignedTo/EMail, AssignedTo/Title, Author/EMail, Author/Title')
            .expand('AssignedTo, Author')
            .filter(invoiceIds.join(' or '))
            .get(),
          sp.web.lists.getByTitle('RelatedInvoiceAttachments')
            .items
            .filter(invoiceIds.join(' or '))
            .getAll(),
          //TODO: How can I filter these results? I don't need every file.
          sp.web.getFolderByServerRelativePath(MyLists["Related Invoice Attachments"])
            .files(),
          sp.web.lists.getByTitle(MyLists["Cancel Invoice Request"])
            .items
            .select('*, Requested_x0020_By/EMail, Requested_x0020_By/Title')
            .expand('Requested_x0020_By')
            .filter(invoiceIds.join(' or '))
            .getAll(),
          sp.web.lists.getByTitle(MyLists["AR Invoices"])
            .items
            .filter(idsForARDocuments.join(' or '))
            .getAll(),
        ])
          .then((values) => {
            console.log('Raw Query Res');
            console.log(values);
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
            for (let index = 0; index < this.state.processedResponse.data.length; index++) {
              this.state.processedResponse.data[index];

              // Replace a request record with an AR Invoice record.
              if (values[ARLoadQuery.ARInvoiceDocuments].filter(f => Number(f.AR_x0020_RequestId) === this.state.processedResponse.data[index].ID).length > 0) {
                this.state.processedResponse.data[index] = values[ARLoadQuery.ARInvoiceDocuments].filter(f => Number(f.AR_x0020_RequestId) === this.state.processedResponse.data[index].ID)[0];
              }

              // For Request Content Type
              if (this.state.processedResponse.data[index].ContentTypeId === MyContentTypes["AR Request List Item"]) {
                this.state.processedResponse.data[index].AccountDetails = values[ARLoadQuery.GLAccounts]
                  .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === this.state.processedResponse.data[index].ID) || [];

                this.state.processedResponse.data[index].Actions = values[ARLoadQuery.InvoiceActions]
                  .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === this.state.processedResponse.data[index].ID) || [];

                this.state.processedResponse.data[index].RelatedAttachments = values[ARLoadQuery.RelatedAttachments]
                  .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === this.state.processedResponse.data[index].ID) || [];

                this.state.processedResponse.data[index].CancelRequests = values[ARLoadQuery.CancelRequests]
                  .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === this.state.processedResponse.data[index].ID) || [];
              }
              // For Invoice Document Content Type
              else {
                this.state.processedResponse.data[index].AccountDetails = values[ARLoadQuery.GLAccounts]
                  .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === this.state.processedResponse.data[index].AR_x0020_RequestId) || [];

                this.state.processedResponse.data[index].Actions = values[ARLoadQuery.InvoiceActions]
                  .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === this.state.processedResponse.data[index].AR_x0020_RequestId) || [];

                this.state.processedResponse.data[index].RelatedAttachments = values[ARLoadQuery.RelatedAttachments]
                  .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === this.state.processedResponse.data[index].AR_x0020_RequestId) || [];

                this.state.processedResponse.data[index].CancelRequests = values[ARLoadQuery.CancelRequests]
                  .filter(f => Number(f.AR_x0020_Invoice_x0020_RequestId) === this.state.processedResponse.data[index].AR_x0020_RequestId) || [];
              }

              // Add ServerDirectUrl if required.
              this.state.processedResponse.data[index].RelatedAttachments.map(relatedAttachments => {
                if (relatedAttachments.ServerRedirectedEmbedUrl === "") {
                  var url = values[ARLoadQuery.FilesRelatedAttachments].find(f => f.Title === relatedAttachments.Title).ServerRelativeUrl;
                  relatedAttachments.ServerRedirectedEmbedUrl = url;
                  relatedAttachments.ServerRedirectedEmbedUri = url;
                }
              });

              // Convert dates from strings to dates.... thanks SharePoint.
              this.state.processedResponse.data[index].Date = new Date(this.state.processedResponse.data[index].Date);
              this.state.processedResponse.data[index].Created = new Date(this.state.processedResponse.data[index].Created);
            }
            // This is something from Kendo demos.
            if (toODataString(this.props.dataState) === this.lastSuccess) {

              // Process data once more to place the ID's in the correct order.
              var outputProcessedResponse = process(this.state.processedResponse.data, this.props.dataState);

              this.props.onARRequestDataReceived.call(undefined, {
                // Add the filtered, sorted data.
                data: outputProcessedResponse.data,
                // Add the total amount of records found prior to filters and sorts being applied.
                total: outputProcessedResponse.total
              });
            } else {
              this.requestARRequestsIfNeeded();
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
