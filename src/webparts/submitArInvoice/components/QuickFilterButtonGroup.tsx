import * as React from 'react';
import * as ReactDom from 'react-dom';

// Import PnP stuff.
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";

// Import Kendo Components
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';

// Import my stuff
import { IInvoiceItem } from './interface/InvoiceItem';
import { InvoiceStatus, InvoiceActionResponseStatus } from './enums/MyEnums';

interface IQuickFilterButtonGroupProps {
  invoices: Array<IInvoiceItem>;
  onButtonClick: any;
}

class QuickFilterButtonGroup extends React.Component<IQuickFilterButtonGroupProps, any> {
  constructor(props) {
    super(props);
  }

  private _getCurrentUser = () => {
    return sp.web.currentUser.get()
      .then(user => { return user; });
  };

  private _submittedInvoices = () => {
    return this.props.invoices.filter(f => f.Invoice_x0020_Status === InvoiceStatus.Submitted);
  }

  // Get invoices that have actions assigned to this user with a status of Waiting.
  private _invoicesForCurrentUser = () => {
    Promise.all([sp.web.currentUser])
      .then(res => {
        res[0].Id
      });

    return this.props.invoices.filter(x =>
      x.Actions.some(y =>
        y.Response_x0020_Status === InvoiceActionResponseStatus.Waiting
        && y.AssignedToId === this._getCurrentUser().Id
      )
    );
  }

  // return invoices that have all actions with a status of approved.
  private _approvedInvoices = () => {
    return this.props.invoices
      .filter(
        f => f.Actions.filter(ff => ff.Response_x0020_Status === InvoiceActionResponseStatus.Approved)
          .length === f.Actions.length && f.Actions.length > 0
      );
  }

  private _waitingApproval = () => {
    return this.props.invoices.filter(x =>
      x.Actions.some(y =>
        y.Response_x0020_Status === InvoiceActionResponseStatus.Waiting
      )
    );
  }

  public render() {
    return (
      <div>
        <ButtonGroup>
          <Button onClick={e => { this.props.onButtonClick(e, this.props.invoices); }}>
            Show All ({this.props.invoices.length})
          </Button>
          <Button>
            For You ({this._invoicesForCurrentUser().length})
          </Button>
          <Button onClick={e => { this.props.onButtonClick(e, this._submittedInvoices()); }}>
            Submitted ({this._submittedInvoices().length})
          </Button>
          <Button onClick={e => { this.props.onButtonClick(e, this._approvedInvoices()); }}>
            Approved ({this._approvedInvoices().length})
          </Button>
          <Button onClick={e => { this.props.onButtonClick(e, this._waitingApproval()); }}>
            Waiting Approval ({this._waitingApproval.length})
          </Button>
        </ButtonGroup>
      </div>
    );
  }
}

export { QuickFilterButtonGroup };
