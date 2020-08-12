import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  Grid,
  GridColumn as Column,
  GridCell,
  GridToolbar,
  GridCellProps,
} from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { Notification, NotificationGroup } from '@progress/kendo-react-notification'
import { Animation, Expand, Fade, Push, Slide, Zoom, Reveal } from '@progress/kendo-react-animation'

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
import { InvoiceStatus, MyGridStrings } from '../enums/MyEnums';
import { ConvertQueryParamsToKendoFilter } from '../MyHelperMethods';
import { InvoiceGridDetailComponent } from '../InvoiceGridDetailComponent';
import { MyLists } from '../enums/MyLists';
import { MyContentTypes } from '../enums/MyEnums';
import { FileRefCell } from '../FileRefCell';
import { IInvoiceItem, IPersonField, IInvoiceUpdateItem } from '../interface/InvoiceItem';
import { IMySaveResult } from '../interface/IMySaveResult';


type MyKendoGridState = {
  data: any;
  receivedData: IARInvoice[];
  filter: any;
  result?: any;
  dataState?: any;
  productInEdit: any;
  productInCancel: any;
  statusData: any;
  siteUsersData: any;
  currentUser?: any;
  saveResult?: IMySaveResult;
};



export class MyKendoGrid extends React.Component<any, MyKendoGridState> {
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
      productInEdit: undefined,
      productInCancel: undefined,
      dataState: {
        take: 20,
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
  public MyCustomCell = (props) => <FileRefCell {...props} />;

  public dataStateChange = (e) => {
    this.setState({
      ...this.state,
      dataState: e.data
    });
  }

  public expandChange = (event) => {
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
    this.setState({
      ...this.state,
      data: invoices,
      receivedData: invoices.data
    });
  }

  public arDataReceived = (invoices) => {
    console.log('arDataReceived');
    console.log(invoices);
    this.setState({
      ...this.state,
      data: invoices,
      receivedData: invoices.data
    });
  }

  public onFilterChange = (e) => {
    var newData = filterBy(this.state.receivedData, e.filter);

    var newStateData = {
      data: newData,
      total: newData.length
    };

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

  // Handle custom customer change event.
  public onCustomCustomerChange = (event) => {
    let target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;

    this.setState({
      productInEdit: {
        ...this.state.productInEdit,
        MiscCustomerDetails: value
      }
    });
  }

  public handleSubmit = (event) => {
    // Used to determine if we're updating an invoice request or an invoice.
    let listName = '';

    let currentEditItem: IInvoiceUpdateItem = {
      Id: event.Id,
      ID: event.ID,
      Department: event.Department,
      Date: event.Date,
      Requested_x0020_ById: event.Requested_x0020_ById,
      Urgent: event.Urgent,
      CustomerId: event.CustomerId,
      Customer_x0020_PO_x0020_Number: event.Customer_x0020_PO_x0020_Number,
      Comment: event.Comment,
      Invoice_x0020_Details: event.Invoice_x0020_Details,
      MiscCustomerName: event.MiscCustomerName,
      MiscCustomerDetails: event.MiscCustomerDetails,
      DirtyField: event.DirtyField,
      Requires_x0020_Department_x0020_Id: {
        results: event.Requires_x0020_Department_x0020_.map(f => f.Id)
      }
    };
    console.log('Updating invoice data from form');
    console.log(currentEditItem);


    // Check to see if the submitted customer contains an ID field.
    // If it does not that means that we're taking in a Misc Customer and will need to parse out the data.
    if (!event.Customer.hasOwnProperty('ID')) {
      // This means we need to take out the customer name.
      currentEditItem.MiscCustomerName = event.Customer.Customer_x0020_Name;
      currentEditItem.DirtyField = new Date();
      currentEditItem.MiscCustomerDetails = this.state.productInEdit.Customer.MiscCustomerDetails;

      // If a customer was previously selected it's ID will still be present.
      currentEditItem.CustomerId = null;
    }
    else {
      // If a custom ID is present then we will need to update the Customer ID property incase it's been changed.
      if (currentEditItem.CustomerId !== event.Customer.Id) {
        currentEditItem.CustomerId = event.Customer.Id
      }
    }


    // This is where we are checking to see what type of invoice (request, or not) we are editing.
    if (event.ContentTypeId === MyContentTypes["AR Request List Item"]) {
      // Update a request item.
      listName = MyLists["AR Invoice Requests"];
    }
    else {
      // Update a document item.
      listName = MyLists["AR Invoices"];
    }


    console.log('Updating this invoice');
    console.log(currentEditItem);
    debugger;


    sp.web.lists
      .getByTitle(listName)
      .items
      .getById(currentEditItem.ID)
      .update(currentEditItem)
      .then(f => {
        debugger;
        // Update the invoices in the state.
        let allInvoices = this.state.data.data;
        const invoiceIndex = allInvoices.findIndex(f => f.ID === currentEditItem.ID);
        let oldInvoiceData = allInvoices[invoiceIndex];
        oldInvoiceData = { ...oldInvoiceData, ...currentEditItem };

        allInvoices.splice(invoiceIndex, 1, oldInvoiceData);
        debugger;

        this.setState({
          data: {
            data: allInvoices,
            total: allInvoices.length
          },
          productInEdit: null
        });
      })
      .catch(e => {
        var res = e;
        console.log('Error while updating invoice');
        console.log(e);
        debugger;
        this.setState({
          saveResult: {
            success: false,
            message: "Could not save your changes.  Please contact help desk."
          }
        });
      });
  }

  public save = () => {
    const dataItem = this.state.productInEdit;
    console.log("saving this data");
    console.log(dataItem);


    const invoices = this.state.data.data.slice();
    // const isNewProduct = dataItem.ProductID === undefined;
    const isNewProduct = false; // false because we don't let users create new items here.

    if (isNewProduct) {
      //invoices.unshift(this.newProduct(dataItem));
    } else {
      const index = invoices.findIndex(p => p.ID === dataItem.ID);
      invoices.splice(index, 1, dataItem);
    }



    let updateObject = {
      Department: dataItem.Department,
      Date: dataItem.Date,
      Requested_x0020_ById: dataItem.Requested_x0020_ById,
      Urgent: dataItem.Urgent,
      CustomerId: dataItem.CustomerId,
      MiscCustomerName: dataItem.CustomerId === null ? dataItem.Customer.Customer_x0020_Name : null,
      MiscCustomerDetails: dataItem.CustomerId === null ? dataItem.Customer.CustomerDetails : null,
      Comment: dataItem.Comment,
      Invoice_x0020_Details: dataItem.Invoice_x0020_Details,
      Customer_x0020_PO_x0020_Number: dataItem.Customer_x0020_PO_x0020_Number,
      Standard_x0020_Terms: dataItem.Standard_x0020_Terms,
    };


    // Update request item.
    if (dataItem.ContentTypeId === MyContentTypes["AR Request List Item"]) {
      updateObject['Requires_x0020_Department_x0020_Id'] = {
        'results': dataItem.Requires_x0020_Department_x0020_Id.map((user) => {
          if (Number.isInteger(user)) {
            return user;
          }
          else {
            return user.Id
          }
        })
      };
      sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).items.getById(dataItem.ID).update(updateObject)
    }
    // Update document item.
    else {
      updateObject['Requires_x0020_Authorization_x0020_ById'] = {
        'results': dataItem.Requires_x0020_Authorization_x0020_ById.map((user) => {
          if (Number.isInteger(user)) {
            return user;
          }
          else {
            return user.Id
          }
        })
      };
      sp.web.lists.getByTitle(MyLists["AR Invoices"]).items.getById(dataItem.ID).update(updateObject)
    }


    if (dataItem.RelatedInvoiceAttachments) {

      for (let index = 0; index < dataItem.RelatedInvoiceAttachments.length; index++) {
        const element = dataItem.RelatedInvoiceAttachments[index];
        sp.web.getFolderByServerRelativeUrl('/sites/FinanceTest/ARTest/RelatedInvoiceAttachments/').files
          .add(element.name, element.getRawFile(), true)
          .then(fileRes => {
            fileRes.file.getItem()
              .then(item => {
                const itemProxy: any = Object.assign({}, item);
                let relatedAttachmentUpdateObject = {
                  Title: element.name
                };

                if (dataItem.ContentTypeId === MyContentTypes["AR Request List Item"]) {
                  relatedAttachmentUpdateObject['AR_x0020_Invoice_x0020_RequestId'] = dataItem.ID
                }
                else {
                  relatedAttachmentUpdateObject['ARInvoiceId'] = dataItem.ID;
                }

                sp.web.lists.getByTitle('RelatedInvoiceAttachments').items.getById(itemProxy.ID).update(relatedAttachmentUpdateObject);
              });
          });
      }
    }


    // Query the new record to get all the new info.
    //TODO: Include more related records here.
    sp.web.lists.getByTitle(MyLists["AR Invoice Requests"])
      .items.getById(dataItem.ID)
      .get()
      .then(response => {
        const index = invoices.findIndex(p => p.ID === dataItem.ID);
        invoices.splice(index, 1, response);
        this.setState({
          data: {
            data: invoices,
            total: invoices.length
          },
          productInEdit: undefined
        });
      });
  }

  public sendCancelRequest = () => {
    sp.web.currentUser.get()
      .then(currentUser => {
        const dataItem = this.state.productInCancel;

        var cancelReqUpdateObj = {
          Title: 'Invoice Cancel Request',
          //Invoice_x0020_NumberId: dataItem.ID,
          Requested_x0020_ById: currentUser.Id,
          Requester_x0020_Comments: dataItem.CancelComment
        };

        if (dataItem.ContentTypeId === MyContentTypes["AR Request List Item"]) {
          cancelReqUpdateObj['AR_x0020_Invoice_x0020_RequestId'] = dataItem.Id
        }
        else {
          cancelReqUpdateObj['Invoice_x0020_NumberId'] = dataItem.Id
          cancelReqUpdateObj['AR_x0020_Invoice_x0020_RequestId'] = dataItem.AR_x0020_RequestId
        }

        sp.web.lists.getByTitle(MyLists["Cancel Invoice Request"])
          .items
          .add(cancelReqUpdateObj)
          .then(createRes => {

            var indexOf = -1;
            var arReqId = -1;

            if (dataItem.ContentTypeId === MyContentTypes["AR Request List Item"]) {
              indexOf = this.state.data.data.findIndex(f => f.ID === dataItem.Id);
              arReqId = dataItem.Id;
            }
            else {
              indexOf = this.state.data.data.findIndex(f => f.AR_x0020_RequestId === dataItem.AR_x0020_RequestId);
              arReqId = dataItem.AR_x0020_RequestId;
            }

            sp.web.lists.getByTitle(MyLists["Cancel Invoice Request"])
              .items.getById(createRes.data.Id)
              .select('*, Requested_x0020_By/EMail, Requested_x0020_By/Title')
              .expand('Requested_x0020_By')
              .get()
              .then(response => {

                var updatedARs = this.state.data.data;
                updatedARs[indexOf].CancelRequests.push(response);

                this.setState({
                  data: {
                    data: updatedARs,
                    total: updatedARs.length
                  },
                  productInCancel: undefined
                });
              });
          });
      });
  }

  public cancel = () => {
    this.setState({ productInEdit: undefined });
  }
  //#endregion

  public rowRender(trElement, props) {
    const red = { backgroundColor: "rgb(243, 23, 0, 0.32)" };
    const trProps = { style: props.dataItem.CancelRequests.length > 0 && red };

    if (props.dataItem.CancelRequests.length > 0) {
      return React.cloneElement(trElement, { ...trProps }, trElement.props.children);
    }
    else {
      return React.cloneElement(trElement, trElement.props.children);
    }
  }

  public render() {
    return (
      <div>
        <Grid
          filterable={true}
          sortable={true}
          pageable={{ buttonCount: 4, pageSizes: true }}
          resizable={true}

          {...this.state.dataState}
          {...this.state.data}

          onDataStateChange={this.dataStateChange}

          filter={this.state.filter}
          onFilterChange={this.onFilterChange}

          style={{ minHeight: '520px', maxHeight: '700px' }}

          onExpandChange={this.expandChange}
          expandField="expanded"

          detail={InvoiceGridDetailComponent}
          rowRender={this.rowRender}
        >
          <GridToolbar>
            {this.state.filter.filters.length > 0 && (
              <Button
                title="Clear All Filters"
                className="k-button"
                icon="filter-clear"
                onClick={_ => { this.onFilterChange({ filter: { ...this.state.filter, filters: [] } }); }}
              >Clear All Filters</Button>
            )}
          </GridToolbar>

          <Column width="75px" field="FileRef" title="" filterable={false} sortable={false} cell={this.MyCustomCell} />
          <Column field="Id" title="Id" width="75px" filterable={false} />
          <Column field="Created" width="250px" title="Created Date" filter="date" format={MyGridStrings.DateFilter} />
          <Column field="Customer.Customer_x0020_Name" width="250px" title="Customer" />
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
              saveResult={this.state.saveResult}
              onSubmit={this.handleSubmit}
              onCustomCustomerChange={this.onCustomCustomerChange}
              cancel={this.cancel}
            />
            : this.state.productInCancel ?
              <MyCancelDialogContainer
                dataItem={this.state.productInCancel}
                save={this.sendCancelRequest}
                cancel={() => { this.setState({ productInCancel: undefined }); }}
              />
              : null
        }

        <InvoiceDataProvider
          dataState={this.state.dataState}
          onDataReceived={this.dataReceived}
          onARRequestDataReceived={this.arDataReceived}

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

    public render() {
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
              onClick={() => { cancel(dataItem); }}
              icon="cancel"
              style={{ "marginBottom": "5px" }}
            >Cancel</Button>
          </td>
        );
    }
  };
}
