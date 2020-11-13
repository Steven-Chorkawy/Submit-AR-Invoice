import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  GridDetailRow
} from '@progress/kendo-react-grid';

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

  public render() {    
    return (
      <div style={{ marginBottom: '3em;' }}>
        <h3>G/L Accounts</h3>
        <AccountListComponent
          accounts={this.props.dataItem.AccountDetails}
          editable={false}
        />
        <hr />
        {
          this.detailItem.CancelRequests &&
          <div>
            {
              this.detailItem.CancelRequests.length > 0 &&
              <div>
                <h3>Cancel Requests</h3>
                <Card style={{ width: 600 }} type='error'>
                  {this.detailItem.CancelRequests.map(cancelReq => {
                    return (
                      <CardBody>
                        <CardTitle>{cancelReq.Requested_x0020_By.EMail} - {cancelReq.Created}</CardTitle>
                        <p>"{cancelReq.Requester_x0020_Comments}"</p>
                        <hr />
                      </CardBody>
                    );
                  })}
                </Card>
              </div>
            }
          </div>
        }
        <h3>Actions Required</h3>
        <ActionStepsComponent actions={this.detailItem.Actions} />
      </div>
    );
  }
}
