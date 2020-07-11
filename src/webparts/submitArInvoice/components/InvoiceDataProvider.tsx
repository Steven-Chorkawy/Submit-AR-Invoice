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
      .select("*, AccountDetails/Account_x0020_Code")
      .expand('AccountDetails')
      .getAll()
      .then(async response => {
        console.log("AR Invoice Found");
        console.log(response);

        this.lastSuccess = this.pending;
        this.pending = '';
        var processedResponse = process(response, this.props.dataState);
        var accountDetailIds = [];
        response.map(r => {
          accountDetailIds.push(`AR_x0020_InvoiceId eq ${r.ID}`);
        });

        //#region Query the required invoice attachments.

        debugger;
        var accountDetailFilter = `${accountDetailIds.join(' or ')}`;

        var accountDetails = await sp.web.lists.getByTitle('AR Invoice Accounts')
          .items
          .filter(accountDetailFilter)
          .get();

        debugger;

        response.map(invoice => {
          invoice.AccountDetails = accountDetails.filter(f => Number(f.AR_x0020_InvoiceId) === invoice.ID);
        });
        //#endregion



        if (toODataString(this.props.dataState) === this.lastSuccess) {
          this.props.onDataReceived.call(undefined, processedResponse);
        } else {
          this.requestDataIfNeeded();
        }
      });
  };

  render() {
    // Query any methods required here.
    this.requestDataIfNeeded();

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
