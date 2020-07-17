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
import { InvoiceDataProvider } from '../InvoiceDataProvider';


type MyKendoGridState = {
  data: any;
  receivedData: IARInvoice[];
  filter: any;
  sort: any;
  group: any;
  result?: any;
  dataState?: any;
  productInEdit: any;
  statusData: any;
  siteUsersData: any;
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

export class MyKendoGrid extends React.Component<any, MyKendoGridState> {
  /**
   *
   */
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      receivedData: [],
      statusData: [],
      siteUsersData: [],
      filter: {
        filters: []
      },
      sort: [],
      group: [],
      productInEdit: undefined,
      dataState: { take: 50, skip: 0 }
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
    debugger;
    var appSate = this.createAppState(event.data);
    debugger;

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

  public dataReceived = (invoices) => {
    console.log("dataReceived");
    console.log(invoices);
    var dataHolder = filterBy(invoices.data, this.state.filter);

    this.setState({
      ...this.state,
      data: invoices,
      receivedData: invoices
    });
  }
  //#endregion

  //#region CRUD Methods


  public onEdit = (dataItem) => {
    this.setState({ productInEdit: Object.assign({}, dataItem) });
  }

  public save = () => {
    const dataItem = this.state.productInEdit;
    debugger;
    const invoices = this.state.data.data.slice();
    // const isNewProduct = dataItem.ProductID === undefined;
    const isNewProduct = false; // false because we don't let users create new items here.

    if (isNewProduct) {
      //invoices.unshift(this.newProduct(dataItem));
    } else {
      const index = invoices.findIndex(p => p.ID === dataItem.ID);
      invoices.splice(index, 1, dataItem);
    }

    this.setState({
      data: {
        data: invoices,
        total: invoices.length
      },
      productInEdit: undefined
    });

    debugger;
    let updateObject  = {
      Department: dataItem.Department,
      Date: dataItem.Date,
      Requested_x0020_ById: dataItem.Requested_x0020_ById,
      // Requires_x0020_Authorization_x0020_ById: {
      //   'results': dataItem.RequiresAuthorizationBy.map((user) => { return user.Id; })
      // },
      Urgent: dataItem.Urgent,
      CustomerId: dataItem.CustomerId,
      Comment: dataItem.Comment,
      Invoice_x0020_Details: dataItem.InvoiceDetails,
      Customer_x0020_PO_x0020_Number: dataItem.CustomerPONumber,
      Standard_x0020_Terms: dataItem.StandardTerms,
    };

    debugger;
    sp.web.lists.getByTitle('AR Invoices').items.getById(dataItem.ID).update(updateObject);

    if (dataItem.RelatedInvoiceAttachments) {
      debugger;
      for (let index = 0; index < dataItem.RelatedInvoiceAttachments.length; index++) {
        const element = dataItem.RelatedInvoiceAttachments[index];
        sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/').files
          .add(element.name, element.getRawFile(), true)
          .then(fileRes => {
            fileRes.file.getItem()
              .then(item => {
                debugger;
                const itemProxy: any = Object.assign({}, item);
                  sp.web.lists.getByTitle('RelatedInvoiceAttachments').items.getById(itemProxy.ID).update({
                    ARInvoiceId: dataItem.ID,
                    Title: element.name
                  });
              });
          });
      }
    }
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

          // data={this.state.result}

          {...this.state.data}
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

        {
          this.state.productInEdit &&
          <MyEditDialogContainer
            dataItem={this.state.productInEdit}
            customers={this.props.customers}
            siteUsers={this.props.siteUsers}

            save={this.save}
            cancel={this.cancel}
          />
        }

        <InvoiceDataProvider
          dataState={this.state.dataState}
          onDataReceived={this.dataReceived}

          statusDataState={this.state.statusData}
          onStatusDataReceived={this.statusDataReceived}

          siteUsersDataState={this.state.siteUsersData}
          onSiteUsersDataReceived={this.siteUserDataReceived}
        />
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
