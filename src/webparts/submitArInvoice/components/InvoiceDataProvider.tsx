import * as React from 'react';
import * as ReactDom from 'react-dom';

/** Start Kendo Imports */
import { toODataString, translateAggregateResults, process } from '@progress/kendo-data-query';
/** End Kendo Imports */

/** Start PnP Imports */
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";
/** End PnP Imports */

class InvoiceDataProvider extends React.Component<any, any> {
  constructor(props) {
    super(props);
  }

  pending = '';
  lastSuccess = '';

  requestDataIfNeeded = () => {
    if (this.pending || toODataString(this.props.dataState) === this.lastSuccess) {

      return;
    }


    this.pending = toODataString(this.props.dataState);


    sp.web.lists.getByTitle('AR Invoices')
      .items
      .getAll()
      .then(async response => {
        this.lastSuccess = this.pending;
        this.pending = '';

        // Apply Kendo grids filters.
        var processedResponse = process(response, this.props.dataState);

        //#region Query the required account details for this invoice.
        // Hold the list of invoice IDs that will be used to pull related accounts.
        var invoiceIds = [];
        response.map(r => {
          invoiceIds.push(`AR_x0020_InvoiceId eq ${r.ID}`);
        });

        // Join each of the invoiceIds together with and or.
        // this will be our final filter string that we send the SharePoint.
        var accountDetailFilter = `${invoiceIds.join(' or ')}`;

        // Using the filter string that we've worked so hard to build we will now get our SharePoint data.
        var accountDetails = await sp.web.lists.getByTitle('AR Invoice Accounts')
          .items
          .filter(accountDetailFilter)
          .get();


        // Using each of the accounts that we found we will not attach them to the invoice object.
        response.map(invoice => { invoice.AccountDetails = accountDetails.filter(f => Number(f.AR_x0020_InvoiceId) === invoice.ID); });
        //#endregion

        // This is something from Kendo demos.
        if (toODataString(this.props.dataState) === this.lastSuccess) {
          this.props.onDataReceived.call(undefined, processedResponse);
        } else {
          this.requestDataIfNeeded();
        }
      });
  };

  requestStatusData = () => {

    if(this.props.statusDataState.length > 0) {
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

  render() {
    // Query any methods required here.
    this.requestDataIfNeeded();
    this.requestStatusData();

    return this.pending && <LoadingPanel />
  };
};

class LoadingPanel extends React.Component {
  render() {
    const loadingPanel = (
      <div className="k-loading-mask">
        <span className="k-loading-text">Loading</span>
        <div className="k-loading-image"></div>
        <div className="k-loading-color"></div>
      </div>
    );

    const gridContent = document && document.querySelector('.k-grid-content');
    return gridContent ? ReactDom.createPortal(loadingPanel, gridContent) : loadingPanel;
  };
};

export { InvoiceDataProvider };
