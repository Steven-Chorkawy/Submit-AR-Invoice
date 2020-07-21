import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  Grid,
  GridColumn as Column,
  GridCell,
  GridToolbar,
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
import { MyCancelDialogContainer } from './MyCancelDialogContainer';
import { InvoiceDataProvider } from '../InvoiceDataProvider';
import { InvoiceStatus, MyGridStrings } from '../enums/MyEnums'
import { ConvertQueryParamsToKendoFilter } from '../MyHelperMethods';



type MyKendoGridState = {
  data: any;
  receivedData: IARInvoice[];
  filter: any;
  sort: any;
  group: any;
  result?: any;
  dataState?: any;
  productInEdit: any;
  productInCancel: any;
  statusData: any;
  siteUsersData: any;
  currentUser?: any;
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
    debugger;
    const dataItem: any = this.props.dataItem;
    return (
      <div>
        <section>
          {
            dataItem.CancelRequests.map(cr => {
              return (<p>{cr.Requested_x0020_ById} - {cr.Requester_x0020_Comments}</p>);
            })
          }
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
    return (this.props.dataItem.Invoice_x0020_Status === InvoiceStatus["Entered into GP"] || this.props.dataItem.Invoice_x0020_Status === InvoiceStatus.Completed) ? (
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
        //filters: []
        logic: "and",
        filters: ConvertQueryParamsToKendoFilter([{ FilterField: 'FILTERFIELD1', FilterValue: 'FILTERVALUE1' }])
      },
      sort: [],
      group: [],
      productInEdit: undefined,
      productInCancel: undefined,
      dataState: {
        take: 50,
        skip: 0,
        sort: [
          { field: 'ID', dir: 'desc' }
        ],
      }
    };

    this.CommandCell = MyCommandCell({
      edit: this.onEdit,
      cancel: this.onInvoiceCancel
    });
  }

  private CommandCell;

  //#region Methods
  MyCustomCell = (props) => <CustomCell {...props} />

  dataStateChange = (e) => {
    this.setState({
      ...this.state,
      dataState: e.data
    })
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

  public currentUserDataReceived = (user) => {
    this.setState({
      ...this.state,
      currentUser: user
    });
  }

  public dataReceived = (invoices) => {
    console.log("dataReceived");
    console.log(invoices);

    var dataHolder = filterBy(invoices.data, this.state.filter);

    this.setState({
      ...this.state,
      data: {
        data: dataHolder,
        total: dataHolder.length
      },
      receivedData: invoices.data
    });
  }

  public onFilterChange = (e) => {
    var newData = filterBy(this.state.receivedData, e.filter);

    var newStateData = {
      data: newData,
      total: newData.length
    }

    this.setState({
      filter: e.filter,
      data: newStateData
    });
  }
  //#endregion

  //#region CRUD Methods


  public onEdit = (dataItem) => {
    this.setState({ productInEdit: Object.assign({}, dataItem) });
  }

  public onInvoiceCancel = (dataItem) => {
    this.setState({
      productInCancel: Object.assign({}, dataItem)
    });
  }

  public save = () => {
    const dataItem = this.state.productInEdit;

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

    let updateObject = {
      Department: dataItem.Department,
      Date: dataItem.Date,
      Requested_x0020_ById: dataItem.Requested_x0020_ById,
      Requires_x0020_Authorization_x0020_ById: {
        'results': dataItem.Requires_x0020_Authorization_x0020_ById.map((user) => {
          if (Number.isInteger(user)) {
            return user;
          } else {
            return user.Id;
          }
        })
      },
      Urgent: dataItem.Urgent,
      CustomerId: dataItem.CustomerId,
      Comment: dataItem.Comment,
      Invoice_x0020_Details: dataItem.Invoice_x0020_Details,
      Customer_x0020_PO_x0020_Number: dataItem.Customer_x0020_PO_x0020_Number,
      Standard_x0020_Terms: dataItem.Standard_x0020_Terms,
    };



    console.log("Edit ITem");
    console.log(dataItem);
    console.log("Sending these changes to save");
    console.log(updateObject);


    sp.web.lists.getByTitle('AR Invoices').items.getById(dataItem.ID).update(updateObject);

    if (dataItem.RelatedInvoiceAttachments) {

      for (let index = 0; index < dataItem.RelatedInvoiceAttachments.length; index++) {
        const element = dataItem.RelatedInvoiceAttachments[index];
        sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/').files
          .add(element.name, element.getRawFile(), true)
          .then(fileRes => {
            fileRes.file.getItem()
              .then(item => {

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

  public sendCancelRequest = () => {
    sp.web.currentUser.get()
      .then(currentUser => {
        debugger;
        const dataItem = this.state.productInCancel;
        sp.web.lists.getByTitle('Cancel Invoice Request')
          .items
          .add({
            Title: 'Invoice Cancel Request',
            Invoice_x0020_NumberId: dataItem.ID,
            Requested_x0020_ById: currentUser.Id,
            Requester_x0020_Comments: dataItem.CancelComment
          })
          .then(_ => {
            this.setState({
              productInCancel: undefined
            });
          });
      });
  }

  public cancel = () => {
    this.setState({ productInEdit: undefined });
  }
  //#endregion

  rowRender(trElement, props) {
    const red = { backgroundColor: "rgb(243, 23, 0, 0.32)" };
    const trProps = { style: props.dataItem.CancelRequests.length > 0 && red };

    if (props.dataItem.CancelRequests.length > 0) {
      return React.cloneElement(trElement, { ...trProps }, trElement.props.children);
    }
    else {
      return React.cloneElement(trElement, trElement.props.children);
    }
  }

  render() {
    return (
      <div>
        <Grid
          filterable={true}
          sortable={true}
          pageable={true}
          resizable={true}

          {...this.state.dataState}
          {...this.state.data}

          onDataStateChange={this.dataStateChange}

          filter={this.state.filter}
          onFilterChange={this.onFilterChange}

          style={{ minHeight: '520px' }}

          onExpandChange={this.expandChange}
          expandField="expanded"

          detail={DetailComponent}
          rowRender={this.rowRender}
        >
          <GridToolbar>
            {this.state.filter.filters.length > 0 && (
              <Button
                title="Clear All Filters"
                className="k-button"
                icon="filter-clear"
                onClick={_ => { this.onFilterChange({ filter: { ...this.state.filter, filters: [] } }) }}
              >Clear All Filters</Button>
            )}
          </GridToolbar>
          <Column
            width="75px"
            field="FileRef"
            title=""
            filterable={false}
            sortable={false}
            cell={this.MyCustomCell} />

          <Column field="ID" title="ID" filterable={false} />
          <Column field="Created" width="250px" title="Created Date" filter="date" format={MyGridStrings.DateFilter} />
          <Column field="Customer.Title" width="250px" title="Customer" />
          <Column field="Invoice_x0020_Status" width="250px" title="Status" />
          <Column field="Date" title="Date" width="250px" filter="date" format={MyGridStrings.DateFilter} />
          <Column field="Type_x0020_of_x0020_Request" width="250px" title="Type" />

          <Column cell={this.CommandCell} width={"110px"} locked={true} resizable={false} filterable={false} sortable={false} />

        </Grid>


        {
          this.state.productInEdit ?
            <MyEditDialogContainer
              dataItem={this.state.productInEdit}
              customers={this.props.customers}
              siteUsers={this.props.siteUsers}
              currentUser={this.state.currentUser}
              save={this.save}
              cancel={this.cancel}
            />
            : this.state.productInCancel ?
              <MyCancelDialogContainer
                dataItem={this.state.productInCancel}
                save={this.sendCancelRequest}
                cancel={() => { this.setState({ productInCancel: undefined }) }}
              />
              : null
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
      </div >
    );
  }
}


export function MyCommandCell({ edit, cancel }) {
  return class extends GridCell {

    constructor(props) {
      super(props);
    }
    render() {
      const { dataItem } = this.props;

      const isNewItem = dataItem.ID === undefined;

      return (this.props.dataItem.Invoice_x0020_Status === InvoiceStatus.Hold || this.props.dataItem.Invoice_x0020_Status === InvoiceStatus.Submitted || this.props.dataItem.Invoice_x0020_Status === InvoiceStatus.Rejected)
        ? (
          <td className={this.props.className + " k-command-cell"} style={this.props.style}>
            <Button
              className="k-primary k-button k-grid-edit-command col-sm-12"
              onClick={() => edit(dataItem)}
              icon="edit"
              style={{ "marginBottom": "5px" }}
            >Edit</Button>
          </td>
        )
        : (
          <td className={this.props.className + " k-command-cell"} style={this.props.style}>
            <Button
              className="k-button k-grid-edit-command col-sm-12 k-text-error"
              onClick={() => { cancel(dataItem) }}
              icon="cancel"
              style={{ "marginBottom": "5px" }}
            >Cancel</Button>
          </td>
        );
    }
  }
};
