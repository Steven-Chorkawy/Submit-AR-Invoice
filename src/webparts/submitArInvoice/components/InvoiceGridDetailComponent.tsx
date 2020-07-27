import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  GridDetailRow
} from '@progress/kendo-react-grid';

import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';

// Custom Imports
import { MyFinanceGlAccounts } from './MyFinanceGLAccounts';
import { ApprovalResponseComponent } from './ApprovalResponseComponent';

export class InvoiceGridDetailComponent extends GridDetailRow {

  constructor(props) {
    super(props);
  }

  public render() {
    return (
      <div style={{ marginBottom: '3em;' }}>
        {this.props.dataItem.CancelRequests && <div> {this.props.dataItem.CancelRequests.length > 0 &&
          <div>
            <h3>Cancel Requests</h3>
            <Card style={{ width: 600 }} type='error'>
              {this.props.dataItem.CancelRequests.map(cancelReq => {
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
        }</div>}

        <h3>G/L Accounts</h3>
        <MyFinanceGlAccounts
          value={this.props.dataItem.AccountDetails}
          showCommandCell={false}
          style={{ 'maxWidth': '1200px' }} />
        <hr />

        <h3>Approval Responses</h3>
        <ApprovalResponseComponent
          approvals={this.props.dataItem.Approvals}
        />
      </div>
    );
  }
}
