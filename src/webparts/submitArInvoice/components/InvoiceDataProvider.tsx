import * as React from 'react';
import * as ReactDom from 'react-dom';

/** Start Kendo Imports */
import { toODataString, process } from '@progress/kendo-data-query';
/** End Kendo Imports */

/** Start PnP Imports */
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";
import { IFile } from '@pnp/sp/files';
/** End PnP Imports */

class InvoiceDataProvider extends React.Component<any, any> {
  constructor(props) {
    super(props);
  }

  public pending = '';
  public lastSuccess = '';

  public requestDataIfNeeded = () => {

    if (this.pending || toODataString(this.props.dataState) === this.lastSuccess) {
      return;
    }

    this.pending = toODataString(this.props.dataState);

    sp.web.lists.getByTitle('AR Invoices')
      .items
      .select('*, Customer/Title')
      .expand('Customer')
      .getAll()
      .then(async response => {
        this.lastSuccess = this.pending;
        this.pending = '';

        // Apply Kendo grids filters.
        var processedResponse = process(response, this.props.dataState);

        // Hold the list of invoice IDs that will be used to pull related accounts.
        var invoiceIds = [];
        var idsForApproval = [];
        var idsForRelatedAttachments = [];

        for (let index = 0; index < response.length; index++) {
          const element = response[index];
          invoiceIds.push(`AR_x0020_InvoiceId eq ${element.ID}`);
          idsForApproval.push(`InvoiceID eq '${element.ID}'`);
          idsForRelatedAttachments.push(`ARInvoice/ID eq ${element.ID}`);

          response[index].Date = new Date(response[index].Date);
          response[index].Created = new Date(response[index].Created);
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
          sp.web.getFolderByServerRelativePath("RelatedInvoiceAttachments").files()
        ])
          .then((values) => {
            // Using each of the accounts that we found we will not attach them to the invoice object.
            response.map(invoice => {
              invoice.AccountDetails = values[0].filter(f => Number(f.AR_x0020_InvoiceId) === invoice.ID) || [];
              invoice.Approvals = values[1].filter(f => Number(f.InvoiceID) === invoice.ID) || [];
              invoice.RelatedAttachments = values[2].filter(f => Number(f.ARInvoiceId) === invoice.ID) || []

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
              this.props.onDataReceived.call(undefined, processedResponse);
            } else {
              this.requestDataIfNeeded();
            }
          });
      });
  };

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
          this.props.onStatusDataReceived.call(undefined, output.Choices)
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

  public render() {

    // Query any methods required here.
    this.requestDataIfNeeded();
    this.requestStatusData();
    this.requestSiteUsers();

    return this.pending && <LoadingPanel />
  }
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
};

export { InvoiceDataProvider };
