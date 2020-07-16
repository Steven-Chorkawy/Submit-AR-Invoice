import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  Grid,
  GridColumn as Column,
  GridCell,
  GridColumnProps,
  GridCellProps,
  GridDetailRow
} from '@progress/kendo-react-grid'
import { NumericTextBox, MaskedTextBox } from '@progress/kendo-react-inputs'
import { Button } from '@progress/kendo-react-buttons'
import { process } from '@progress/kendo-data-query';
import { ListView, ListViewHeader, ListViewFooter } from '@progress/kendo-react-listview';

//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Import my stuff.
import IARInvoice from '../IARInvoice';
import { filterBy, orderBy, groupBy } from '@progress/kendo-data-query';
import { MyEditDialogContainer } from './MyEditDialogContainer';



type MyKendoGridProps = {

}

type MyKendoGridState = {
  data: IARInvoice[];
  filter: any;
  sort: any;
  group: any;
  result?: any;
  dataState?: any;
  productInEdit: any;
}



const MyItemRender = props => {
  return (
    <div style={{ width: "90%" }}>
      <div className='row' style={{ marginBottom: "1px" }}>
        <div className='col-sm-6'>
          <MaskedTextBox
            mask="000-00-000-00000-0000"
            title="Account Code"
            defaultValue={props.dataItem.Account_x0020_Code}
            readonly={true}
          />
        </div>
        <div className='col-sm-6' title="Amount Before HST">
          <NumericTextBox
            defaultValue={props.dataItem.Amount}
            format="c2"
            disabled={true}
            min={0}
          />
        </div>
      </div>

      <div className='row' style={{ marginBottom: "5px" }}>
        <div className='col-sm-2' title="HST Applied">
          HST: {props.dataItem.HST_x0020_Taxable ? 'Yes' : 'No'}
        </div>

        <div className='col-sm-4' title="HST">
          <NumericTextBox
            defaultValue={Number(props.dataItem.HST)}
            format="c2"
            disabled={true}
            min={0}
          />
        </div>

        <div className='col-sm-6' title="Amount After HST">
          <NumericTextBox
            defaultValue={Number(props.dataItem.Total_x0020_Invoice)}
            format="c2"
            disabled={true}
            min={0}
          />
        </div>
      </div>

      <hr />
    </div>
  );
}

class DetailComponent extends GridDetailRow {
  render() {
    const dataItem: IARInvoice = this.props.dataItem;
    return (
      <div>
        <section>
          <h2>Accounts</h2>
          <ListView
            data={dataItem.AccountDetails}
            item={MyItemRender}
            style={{ width: "40%" }}
          />
          <hr />
        </section>
        <section>
          <h2>Details</h2>
          <p>... add more details here...</p>
          {/* <p><strong>Category:</strong> {dataItem.Category.CategoryName} - {dataItem.Category.Description}</p> */}
        </section>
        <section>

        </section>
      </div>
    );
  }
}


/**
 * Used to Render a url to the current file.
 */
class CustomCell extends React.Component<GridCellProps> {
  render() {
    return (this.props.dataItem.Invoice_x0020_Status === 'Entered in GP' || this.props.dataItem.Invoice_x0020_Status === 'Completed') ? (
      <td title={'Click to view invoice.'}>
        <a href={this.props.dataItem.FileRef} target='_blank' >
          <Button primary={true} /*icon="hyperlink-open"*/ icon="folder"></Button>
        </a>
      </td>
    ) : (
        <td title={'Invoice not processed...'}>
          <Button primary={true} /*icon="hyperlink-open"*/ icon="folder" disabled={true}></Button>
        </td>
      );
  }
}

export class MyKendoGrid extends React.Component<MyKendoGridProps, MyKendoGridState> {
  /**
   *
   */
  constructor(props) {
    super(props);

    this.state = {
      data: props.data,
      filter: {
        filters: []
      },
      sort: [],
      group: [],
      productInEdit: undefined,
    };

    this.CommandCell = MyCommandCell({
      edit: this.onEdit
    });

    this.state = this.createAppState({ ...this.state });
  }

  private CommandCell;

  //#region Methods
  MyCustomCell = (props) => <CustomCell {...props} />

  createAppState = (dataState) => {
    var output = {
      result: process(this.state.data, dataState),
      dataState: dataState,
      ...dataState
    };

    return output;
  }

  dataStateChange = (event) => {
    var appSate = this.createAppState(event.data);
    this.setState(appSate);
  }

  expandChange = (event) => {
    event.dataItem[event.target.props.expandField] = event.value;
    this.setState({
      result: Object.assign({}, this.state.result),
      dataState: this.state.dataState
    });
  }

  //#endregion


  //#region CRUD Methods
  public onEdit = (dataItem) => {
    this.setState({ productInEdit: Object.assign({}, dataItem) });
  }

  public save = () => {
    const dataItem = this.state.productInEdit;
    // const products = this.state.products.slice();
    // const isNewProduct = dataItem.ProductID === undefined;

    // if (isNewProduct) {
    //   products.unshift(this.newProduct(dataItem));
    // } else {
    //   const index = products.findIndex(p => p.ProductID === dataItem.ProductID);
    //   products.splice(index, 1, dataItem);
    // }

    // this.setState({
    //   products: products,
    //   productInEdit: undefined
    // });
  }

  public cancel = () => {
    this.setState({ productInEdit: undefined });
  }
  //#endregion


  render() {
    return (
      <div>
        <Grid
          style={{ height: '520px' }}
          resizable={true}
          reorderable={true}
          filterable={true}
          sortable={true}
          pageable={{ pageSizes: true }}
          groupable={true}

          data={this.state.result}
          onDataStateChange={this.dataStateChange}
          {...this.state.dataState}

          onExpandChange={this.expandChange}
          expandField="expanded"

          detail={DetailComponent}
        >
          <Column
            width="75px"
            field="FileRef"
            filterable={false}
            sortable={false}
            cell={this.MyCustomCell} />

          <Column field="Date" title="Date" width="250px" filter="date" format="{0:dd-MMM-yyyy}" />
          <Column field="Department" width="250px" title="Department" />
          <Column field="Invoice_x0020_Status" width="250px" title="Status" />
          <Column field="Type_x0020_of_x0020_Request" width="250px" title="Type" />
          <Column field="Customer.Title" width="250px" title="Customer" />
          <Column field="Batch_x0020_Number" width="250px" title="Batch Number" />

          <Column cell={this.CommandCell} width={"110px"} locked={true} resizable={false} filterable={false} sortable={false} />

        </Grid>

        {this.state.productInEdit && <MyEditDialogContainer dataItem={this.state.productInEdit} save={this.save} cancel={this.cancel} />}
      </div>
    );
  }
}


export function MyCommandCell({ edit }) {
  return class extends GridCell {

    constructor(props) {
      super(props);
    }
    render() {
      const { dataItem } = this.props;

      const isNewItem = dataItem.ID === undefined;

      return (this.props.dataItem.Invoice_x0020_Status !== 'Entered in GP' && this.props.dataItem.Invoice_x0020_Status !== 'Completed') && (
        <td className={this.props.className + " k-command-cell"} style={this.props.style}>
          <Button
            className="k-primary k-button k-grid-edit-command col-sm-12"
            onClick={() => edit(dataItem)}
            icon="edit"
            style={{ "marginBottom": "5px" }}
          >Edit</Button>
        </td>
      );
    }
  }
};
