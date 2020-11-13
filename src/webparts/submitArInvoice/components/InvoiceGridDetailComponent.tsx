import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import { GridDetailRow } from '@progress/kendo-react-grid';

import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';

// Custom Imports
import { ActionStepsComponent } from './ActionStepsComponent';
import { IInvoiceItem } from './interface/InvoiceItem';
import { AccountListComponent } from './AccountListComponent';

export class InvoiceGridDetailComponent extends GridDetailRow {

  constructor(props) {
    super(props);
    this.detailItem = this.props.dataItem;
  }

  private detailItem: IInvoiceItem;

  private _bsColClassNames = 'col-lg-4 col-sm-12';
  private _maxWidth = '1000px';

  public render() {
    return (
      <div style={{ maxWidth: this._maxWidth }}>
        {console.log('Grid Detail Row.')}
        {console.log(this.props.dataItem)}
        <div className={'row'}>
          {
            this.props.dataItem.Actions && this.props.dataItem.Actions.length > 0 &&
            <div className={this._bsColClassNames}>
              <Card>
                <CardBody>
                  <CardTitle>Approval Requests</CardTitle>
                  <ActionStepsComponent actions={this.props.dataItem.Actions} />
                </CardBody>
              </Card>
            </div>
          }

          <div className={this._bsColClassNames}>2</div>
          <div className={this._bsColClassNames}>3</div>
        </div>
      </div>
    );
  }
}
