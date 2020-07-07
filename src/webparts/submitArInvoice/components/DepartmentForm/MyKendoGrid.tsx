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


type MyKendoGridProps = {

}

type MyKendoGridState = {
  data: IARInvoice[];
  filter: any;
  sort: any;
  group: any;
  result?: any;
  dataState?: any;
}



const MyItemRender = props => {
  console.log("MyItemRender");
  console.log(props);
  return (
    <div>
      <div className='row w-100 no-gutters'>
        <div className='col-sm-3'>
          <MaskedTextBox
            mask="000-00-000-00000-0000"
            defaultValue={props.dataItem.Account_x0020_Code}
            readonly={true}
            />
        </div>
        <div className='col-sm-2'>
          <NumericTextBox
                    defaultValue={props.dataItem.Amount}
                    format="c2"
                    disabled={true}
                    min={0}
                />
        </div>
      </div>
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
            style={{ width: "45%" }}
          />
          <hr />
        </section>
        <section>
          <p><strong>In Stock:</strong> {dataItem.Title} </p>
          <p><strong>On Order:</strong> {dataItem.Type_x0020_of_x0020_Request} </p>
          <p><strong>Reorder Level:</strong> {dataItem.Department} </p>
          <p><strong>Discontinued:</strong> {dataItem.Date}</p>
          {/* <p><strong>Category:</strong> {dataItem.Category.CategoryName} - {dataItem.Category.Description}</p> */}
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
    console.log(this.props);
    return (
      <td title={this.props.dataItem.StrTitle}>
        <a href={this.props.dataItem.FileRef} target='_blank' >
          <Button primary={true} /*icon="hyperlink-open"*/ icon="folder"></Button>
        </a>
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
      group: []
    };

    this.state = this.createAppState({ ...this.state });
    console.log("State after ctor");
    console.log(this.state);
  }

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

  render() {
    return (
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
          title="Link to File"
          filterable={false}
          sortable={false}
          cell={this.MyCustomCell} />


        <Column field="Date" title="Date" width="250px" filter="date" format="{0:dd-MMM-yyyy}" />
        <Column field="Department" width="250px" title="Department" />
        <Column field="Invoice_x0020_Status" width="250px" title="Status" />
        <Column field="Type_x0020_of_x0020_Request" width="250px" title="Type" />
        <Column field="Customer.Title" width="250px" title="Customer" />
        <Column field="Batch_x0020_Number" width="250px" title="Batch Number" />

      </Grid>
    );
  }
}
