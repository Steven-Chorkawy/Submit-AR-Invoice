import * as React from 'react';
import * as ReactDom from 'react-dom';

import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Pager } from '@progress/kendo-react-data-tools';

import { InvoiceDataProvider } from '../InvoiceDataProvider';


// Content of List Item
const MyItemRender = props => {
  let item = props.dataItem;

  return (
      <Card key={props.dataItem.ID} orientation='vertical' style={{ borderWidth: '0px 0px 1px', width: '100%', marginBottom:'15px' }}>
        <CardBody>
          <div className='row p-2 border-bottom align-middle' style={{ margin: 0 }}>
            <div className='col-sm-2'>
              ID: {item.ID}
            </div>
            <div className='col-sm-6'>
              <h2 style={{ fontSize: 14, color: '#454545', marginBottom: 0, marginTop: 0 }} className="text-uppercase">name</h2>
              <div style={{ fontSize: 12, color: "#a0a0a0" }}>email</div>
            </div>
            <div className='col-sm-4'>
              <div className='k-chip k-chip-filled'>
                <div className='k-chip-content'>new messages</div>
              </div>
            </div>
          </div>
        </CardBody>
        <CardBody>
          Card body 2
        </CardBody>
        <CardActions>
          <button className='k-button k-bare'>1</button>
          <button className='k-button k-bare'>2</button>
          <button className='k-button k-bare'>3</button>
          <button className='k-button k-bare'>4</button>
        </CardActions>
      </Card>
  );
}

class DepartmentListView extends React.Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      invoicesReceived: {},
      receivedData: [],
      statusData: [],
      siteUsersData: [],

      productInEdit: undefined,
      productInCancel: undefined,
      dataState: {
        take: 5,
        skip: 0
      }
    };
  }



  //#region Data Operations
  public statusDataReceived = (status) => {
    this.setState({
      ...this.state,
      statusData: status
    });
  }

  public siteUserDataReceived = (users) => {
    this.setState({
      ...this.state,
      siteUsersData: users
    });
  }

  public currentUserDataReceived = (user) => {
    this.setState({
      ...this.state,
      currentUser: user
    });
  }

  public dataReceived = (invoices) => {
    debugger;
    console.log("dataReceived");
    console.log(invoices);

    this.setState({
      ...this.state,
      invoicesReceived: invoices,
      receivedData: invoices.data
    });
  }
  //#endregion

  //#region Pager Methods
  handlePageChange = event => {
    const { skip, take } = event;
    this.setState({
      dataState: {
        ...this.state.dataState,
        take: take,
        skip: skip
      }
    });

    console.log(`Page Change: skip ${skip}, take ${take}`);
  };
  //#endregion Pager Methods

  public render() {
    return (
      <div>
        {
          this.state.invoicesReceived.data ?
            <div>
              <ListView
                data={this.state.invoicesReceived.data}
                item={MyItemRender}
                style={{ width: "100%" }}
              />
              <Pager
                skip={this.state.dataState.skip}
                take={this.state.dataState.take}
                total={this.state.invoicesReceived.total}
                buttonCount={5}
                info={true}
                type={'numeric'}
                previousNext={true}
                pageSizes={[5, 10, 15, 20, 25]}
                onPageChange={this.handlePageChange}
              />
            </div>
            : <p>Loading...</p>
        }

        <InvoiceDataProvider
          dataState={this.state.dataState}
          onDataReceived={this.dataReceived}

          statusDataState={this.state.statusData}
          onStatusDataReceived={this.statusDataReceived}

          siteUsersDataState={this.state.siteUsersData}
          onSiteUsersDataReceived={this.siteUserDataReceived}

          currentUserDataState={this.state.currentUser}
          onCurrentUserDataReceived={this.currentUserDataReceived}
        />
      </div>
    );
  }
}


export { DepartmentListView };
