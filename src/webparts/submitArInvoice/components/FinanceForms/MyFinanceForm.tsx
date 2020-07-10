import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  Grid,
  GridColumn,
  GridCell,
  GridColumnProps,
  GridCellProps,
  GridDetailRow,
  GridToolbar
} from '@progress/kendo-react-grid'
import { NumericTextBox, MaskedTextBox } from '@progress/kendo-react-inputs'
import { Button } from '@progress/kendo-react-buttons'

import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';

//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Custom Imports
import { InvoiceDataProvider } from '../InvoiceDataProvider';
import { MyCommandCell } from './MyCommandCell';

class MyFinanceForm extends React.Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      invoices: { data: [], total: 0 },
      dataState: { take: 10, skip: 0 }
    };

    this.CommandCell = MyCommandCell({
      edit: this.enterEdit,
      remove: this.remove,

      add: this.add,
      discard: this.discard,

      update: this.update,
      cancel: this.cancel,

      editField: this.editField
    });
  }

  //#region Variables
  private editField: string = "inEdit";
  //#endregion

  //#region Custom Components
  CommandCell
  //#endregion

  //#region Methods
  dataReceived = (invoices) => {
    console.log("dataReceived");
    console.log(invoices);
    this.setState({
      ...this.state,
      invoices: invoices
    });
  };


  dataStateChange = (e) => {
    console.log("dataStateChange");
    console.log(e);
    this.setState({
      ...this.state,
      dataState: e.data
    });
  }
  //#endregion End Methods

  //#region CRUD Methods
  removeItem(data, item) {
    let index = data.findIndex(p => p === item || (item.ProductID && p.ProductID === item.ProductID));
    if (index >= 0) {
      data.splice(index, 1);
    }
  }

  itemChange = (event) => {
    console.log("itemChange");
    console.log(event);
    throw "Not Implemented yet!";
  };

  enterEdit = (dataItem) => {
    this.setState({
      data: this.state.data.map(item =>
        item.ProductID === dataItem.ProductID ?
          { ...item, inEdit: true } : item
      )
    });
  }

  add = (dataItem) => {
    dataItem.inEdit = undefined;

    this.setState({
      data: [...this.state.data]
    });
  }

  update = (dataItem) => {
    const data = [...this.state.data];
    const updatedItem = { ...dataItem, inEdit: undefined };

    this.updateItem(data, updatedItem);

    this.setState({ data });
  }

  updateItem = (data, item) => {
    let index = data.findIndex(p => p === item || (item.ProductID && p.ProductID === item.ProductID));
    if (index >= 0) {
      data[index] = { ...item };
    }
  }

  //TODO: Change ProductID.
  cancel = (dataItem) => {
    const originalItem = this.state.invoices.data.find(p => p.ProductID === dataItem.ProductID);
    const data = this.state.data.map(item => item.ProductID === originalItem.ProductID ? originalItem : item);

    this.setState({ data });
  }

  discard = (dataItem) => {
    const data = [...this.state.data];
    this.removeItem(data, dataItem);

    this.setState({ data });
  }

  remove = (dataItem) => {
    const data = [...this.state.data];
    this.removeItem(data, dataItem);

    this.setState({ data });
  }
  //#endregion end CRUD Methods

  render() {
    return (
      <div>
        <Grid
          // onItemChange={this.itemChange}
          filterable={true}
          sortable={true}
          pageable={true}
          resizable={true}
          {...this.state.dataState}
          {...this.state.invoices}
          onDataStateChange={this.dataStateChange}
        >
          <GridToolbar>
            tool bar here...
          </GridToolbar>

          <GridColumn field="ID" title="ID" width="100px" />
          <GridColumn field="Type_x0020_of_x0020_Request" title="Type" width="100px" />
          <GridColumn field="Invoice_x0020_Status" title="Status" width="100px" />
          <GridColumn field="Invoice_x0020_Number" title="Invoice #" width="100px" />
          <GridColumn field="Batch_x0020_Number" title="Batch #" width="100px" />
          <GridColumn field="Department" title="Department" width="100px" />
          <GridColumn field="Date" title="Date" width="100px" />
          <GridColumn field="Urgent" title="Urgent" width="100px" />
          <GridColumn field="Customer" title="Customer" width="100px" />
          <GridColumn field="Customer_x0020_PO_x0020_Number" title="Customer PO #" width="100px" />

          <GridColumn cell={this.CommandCell} width="100px" locked={true} resizable={false} filterable={false} sortable={false} />
        </Grid>

        <InvoiceDataProvider
          dataState={this.state.dataState}
          onDataReceived={this.dataReceived}
        />
      </div>
    );
  };
}

export { MyFinanceForm };
