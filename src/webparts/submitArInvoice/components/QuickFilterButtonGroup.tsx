import * as React from 'react';
import * as ReactDom from 'react-dom';

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

  private _submittedInvoices = () => {
    return this.props.invoices.filter(f => f.Invoice_x0020_Status === InvoiceStatus.Submitted);
  }

  private _invoicesForCurrentUser = () => {
    //TODO: Write filter for invoices that have an action that needs the current users approval.
  }

  private _approvedInvoices = () => {
    return this.props.invoices
      .filter(f =>
        f.Actions.filter(ff =>
          ff.Response_x0020_Status === InvoiceActionResponseStatus.Approved
        ).length === f.Actions.length
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
            For You (0)
          </Button>
          <Button onClick={e => { this.props.onButtonClick(e, this._submittedInvoices()); }}>
            Submitted ({this._submittedInvoices().length})
          </Button>
          <Button>
            Approved (0)
          </Button>
          <Button>
            Waiting Approval (0)
          </Button>
        </ButtonGroup>
      </div>
    );
  }
}

export { QuickFilterButtonGroup };
