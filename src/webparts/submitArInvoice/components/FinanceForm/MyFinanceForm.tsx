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


class MyFinanceForm extends React.Component<any, any> {
  render(){
    return (
      <h1>Hello from MyFinanceForm</h1>
    );
  };
}

export { MyFinanceForm };
