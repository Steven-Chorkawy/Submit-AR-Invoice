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
      .then(response => {
        console.log("AR Invoice Found");
        console.log(response);
        this.lastSuccess = this.pending;
        this.pending = '';
        if (toODataString(this.props.dataState) === this.lastSuccess) {
          this.props.onDataReceived.call(undefined, process(response, this.props.dataState));
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
