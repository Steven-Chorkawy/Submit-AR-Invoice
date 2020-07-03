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

import { Button } from '@progress/kendo-react-buttons'

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
import { filterBy } from '@progress/kendo-data-query';


type MyKendoGridProps = {

}

type MyKendoGridState = {
  data: IARInvoice[];
  filter: any;
  sort:any;
}


class DetailComponent extends GridDetailRow {
  render() {
    const dataItem: IARInvoice = this.props.dataItem;
    return (
      <section>
        <p><strong>In Stock:</strong> {dataItem.Title} </p>
        <p><strong>On Order:</strong> {dataItem.Type_x0020_of_x0020_Request} </p>
        <p><strong>Reorder Level:</strong> {dataItem.Department} </p>
        <p><strong>Discontinued:</strong> {dataItem.Date}</p>
        {/* <p><strong>Category:</strong> {dataItem.Category.CategoryName} - {dataItem.Category.Description}</p> */}
      </section>
    );
  }
}

/**
 * Used to Render a url to the current file.
 */
class CustomCell extends React.Component<GridCellProps> {
  render() {
    return (
      <td>
        <a href={this.props.dataItem.FileRef} target='_blank'>
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

    console.log("MyKendoGrid Props");
    console.log(props);

    this.state = {
      data: props.data,
      filter: {
        logic: "",
        filters: []
      },
      sort: []
    }
  }

  MyCustomCell = (props) => <CustomCell {...props} />

  render() {
    return (
      <Grid
        style={{ height: '400px' }}

        data={filterBy(this.state.data, this.state.filter)}

        detail={DetailComponent}
        expandField="expanded"
        onExpandChange={(event) => {
          event.dataItem.expanded = !event.dataItem.expanded;
          this.forceUpdate();
        }}

        filterable
        filter={this.state.filter}
        onFilterChange={
          (e) => {
            this.setState({
              filter: e.filter
            });
          }
        }

        sortable
        sort={this.state.sort}
        onSortChange={
          (e) => {
            this.setState({
              sort: e.sort
            });
          }
        }
      >
        <Column field="ID" title="ID" width="40px" filterable={false} sortable={false} />
        <Column field="Date" title="Date" width="250px" filter="date" format="{0:MMM yyyy}" />
        <Column field="Department" title="Department" />
        <Column
          field="FileRef"
          title="Link to File"
          filterable={false}
          sortable={false}
          cell={this.MyCustomCell} />

      </Grid>
    );
  }
}
