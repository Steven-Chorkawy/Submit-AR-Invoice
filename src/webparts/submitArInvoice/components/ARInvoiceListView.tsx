import * as React from 'react';
import * as ReactDom from 'react-dom';

import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';
import { Card, CardTitle, CardSubtitle, CardBody, CardActions } from '@progress/kendo-react-layout';
import { Pager } from '@progress/kendo-react-data-tools';
import { Button } from '@progress/kendo-react-buttons';

import { InvoiceDataProvider } from './InvoiceDataProvider';
import { ARListViewItem } from './ARListViewItem';


// Content of List Item
const MyItemRender = (props) => {
  let item = props.dataItem;
  

  return (
    <ARListViewItem {...props} />
  );
}

const MyPager = props => {
  return (
    <Pager
      skip={props.dataState.skip}
      take={props.dataState.take}
      total={props.invoicesReceived.total}
      buttonCount={5}
      info={true}
      type={'numeric'}
      previousNext={true}
      pageSizes={[5, 10, 15, 20, 25]}
      onPageChange={props.handlePagesChange}
    />
  );
}

class ARInvoiceListView extends React.Component<any, any> {
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
      },
      showAllListDetails: false
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
              {MyPager({ ...this.state, handlePagesChange: this.handlePageChange })}
              <ListView
                data={this.state.invoicesReceived.data}
                item={(item) => { return MyItemRender({ ...item, showMore: this.state.showAllListDetails }) }}
                style={{ width: "100%" }}
              />
              {MyPager({ ...this.state, handlePagesChange: this.handlePageChange })}
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


export { ARInvoiceListView };
