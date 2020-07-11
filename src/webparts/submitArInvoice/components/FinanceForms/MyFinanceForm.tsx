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

interface IMyFinanceFormState {
  invoices: IInvoicesDataState;
  receivedData: IInvoicesDataState;
  dataState: any;
};

interface IInvoicesDataState {
  //TODO: Change Array<any> to Array<IInvoice>
  data: Array<any>;
  total: number;
};


class MyFinanceForm extends React.Component<any, IMyFinanceFormState> {
  constructor(props) {
    super(props);

    this.state = {
      invoices: { data: [], total: 0 },
      // Same as invoices but this object is used to restore data to it's original state.
      receivedData: { data: [], total: 0 },
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
      invoices: invoices,
      receivedData: invoices
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
    let index = data.findIndex(p => p === item || (item.ID && p.ID === item.ID));
    if (index >= 0) {
      data.splice(index, 1);
    }
  }

  itemChange = (event) => {
    console.log("itemChange");
    console.log(event);
    const data = this.state.invoices.data.map(item =>
      item.ID === event.dataItem.ID ? { ...item, [event.field]: event.value } : item
    );

    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  };

  /**
   * Grid Edit button click event.
   * @param dataItem Invoice that will be sent to edit mode.
   */
  enterEdit = (dataItem) => {
    console.log("enterEdit");
    console.log(dataItem);
    this.setState({
      invoices: {
        // Set any other properties of state.invoices
        ...this.state.invoices,
        // Update the data property.
        // data property is where the invoice objects are held.
        data: this.state.invoices.data.map(item =>
          item.ID === dataItem.ID ? { ...item, inEdit: true } : item
        )
      }
    });
  }


  /**
   * Add/Save new invoice.
   * @param dataItem New Invoice
   */
  add = (dataItem) => {
    dataItem.inEdit = undefined;

    // TODO: Call method that adds dataItem to the SP List.

    this.setState({
      invoices: {
        ...this.state.invoices
      }
    });
  }

  update = (dataItem) => {
    const data = [...this.state.invoices.data];
    const updatedItem = { ...dataItem, inEdit: undefined };

    this.updateItem(data, updatedItem);

    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  }

  updateItem = (data, item) => {
    let index = data.findIndex(p => p === item || (item.ID && p.ID === item.ID));
    if (index >= 0) {
      data[index] = { ...item };
    }
  }

  /**
   * Cancel and discard all changes made to the current edit.
   * @param dataItem Invoice item that we are no longer editing.
   */
  cancel = (dataItem) => {
    const originalItem = this.state.receivedData.data.find(p => p.ID === dataItem.ID);
    const data = this.state.invoices.data.map(item => item.ID === originalItem.ID ? originalItem : item);
    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  }

  discard = (dataItem) => {
    const data = [...this.state.invoices.data];
    this.removeItem(data, dataItem);

    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  }

  remove = (dataItem) => {
    const data = [...this.state.invoices.data];
    this.removeItem(data, dataItem);

    this.setState({
      invoices: {
        ...this.state.invoices,
        data: data
      }
    });
  }

  //TODO: Remove this method.  We should not be allowed to add new items in this form.
  /**
   * Create a new row on the grid.
   * This new row is where we can enter new invoices.
   */
  addNew = () => {
    throw "Don't let this happen.";
    // const newDataItem = { inEdit: true, Discontinued: false };

    // this.setState({
    //   data: [newDataItem, ...this.state.invoices.data]
    // });
  }

  /**
   * Cancel all changes made.
   */
  cancelCurrentChanges = () => {
    // reset everything back.
    this.setState({
      invoices: {...this.state.receivedData}
    });
  }
  //#endregion end CRUD Methods

  render() {

    const hasEditedItem = this.state.invoices.data.some(p => p.inEdit);
    return (
      <div>
        <Grid
          filterable={true}
          sortable={true}
          pageable={true}
          resizable={true}
          {...this.state.dataState}
          {...this.state.invoices}
          onDataStateChange={this.dataStateChange}
          onItemChange={this.itemChange}
          editField={this.editField}
        >
          <GridToolbar>
            {hasEditedItem && (
              <button
                title="Cancel current changes"
                className="k-button"
                onClick={this.cancelCurrentChanges}
              >
                Cancel current changes
              </button>
            )}
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
