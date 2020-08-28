import * as React from 'react';
import * as ReactDom from 'react-dom';

// Import Kendo Components
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';

// Import my stuff
import { IInvoiceItem, IInvoiceUpdateItem } from './interface/InvoiceItem';
import { InvoiceStatus } from './enums/MyEnums';

interface IQuickFilterButtonGroupProps {
  invoices: Array<IInvoiceItem>;
}

class QuickFilterButtonGroup extends React.Component<IQuickFilterButtonGroupProps, any> {
  constructor(props) {
    super(props);
  }

  public render() {
    return (
      <div>
        <ButtonGroup>
          <Button>Show All ({this.props.invoices.length})</Button>
          <Button>For You (0)</Button>
          <Button>Submitted ({this.props.invoices.filter(f => f.Invoice_x0020_Status === InvoiceStatus.Submitted).length})</Button>
          <Button>Approved (0)</Button>
          <Button>Waiting Approval (0)</Button>
        </ButtonGroup>
      </div>
    );
  }
}


export { QuickFilterButtonGroup };
