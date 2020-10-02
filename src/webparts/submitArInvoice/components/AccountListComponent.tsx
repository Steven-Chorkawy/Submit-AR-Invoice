import * as React from 'react';
import * as ReactDom from 'react-dom';

import { ListView, ListViewHeader } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardSubtitle, CardBody } from '@progress/kendo-react-layout';

interface IAccountListComponentProps {
  accounts: any;
  editable: boolean;
}

class AccountListItem extends React.Component<any, any> {
  constructor(props) {
    super(props);
  }

  public render() {
    return (
      <div>
        <Card orientation='horizontal' style={{ width: '50%', borderWidth: '0px 0px 1px' }}>
          <CardBody>
            <div className='k-hbox k-justify-content-between k-flex-wrap'>
              <div style={{ padding: '5 0' }}>
                <CardTitle style={{ marginBottom: '0px' }}>
                  <span title='Account Code'>{this.props.dataItem.Account_x0020_Code}</span> | <span title='Total Invoice'>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.props.dataItem.Total_x0020_Invoice)}</span>
                </CardTitle>
                <CardBody>
                  <div className='row'>
                    <div className='col-sm-4'>Amount</div>
                    <div className='col-sm-8'><span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.props.dataItem.Amount)}</span></div>
                  </div>
                  <div className='row'>
                    <div className='col-sm-4'>HST</div>
                    <div className='col-sm-8'><span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.props.dataItem.HST)}</span></div>
                  </div>
                </CardBody>
              </div>
              {
                this.props.editable &&
                <div style={{ width: '25%', padding: '5 0' }}>
                  <button className='k-button k-primary' style={{ marginRight: 5 }}>Edit</button>
                  <button className='k-button' >Delete</button>
                </div>
              }
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }
}

class AccountListComponent extends React.Component<IAccountListComponentProps, any> {
  constructor(props) {
    super(props);
  }

  // TODO: Add CRUD methods here.
  private MyAccountItem = props => <AccountListItem {...props} />;

  public render() {
    return (
      this.props.accounts.length > 0
        ? <ListView
          data={this.props.accounts}
          item={this.MyAccountItem}
        />
        : <span>No Accounts Found.</span>
    );
  }
}

export { AccountListComponent, AccountListItem };
