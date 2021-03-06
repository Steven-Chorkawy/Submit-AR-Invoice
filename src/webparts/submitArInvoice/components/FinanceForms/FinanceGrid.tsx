import * as React from 'react';
import * as ReactDom from 'react-dom';

// Kendo Imports
import {
  Grid,
  GridColumn,
  GridToolbar
} from '@progress/kendo-react-grid';
import { Button } from '@progress/kendo-react-buttons';
import { toODataString, process, filterBy } from '@progress/kendo-data-query';


//PnPjs Imports
import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

// Custom Imports
import { InvoiceDataProvider, QueryInvoiceData } from '../InvoiceDataProvider';
import { MyCommandCell } from './MyCommandCell';
import { InvoiceStatus, MyGridStrings, MyContentTypes } from '../enums/MyEnums';
import { ConvertQueryParamsToKendoFilter, BuildGUID, CreateInvoiceAction, GetUserByLoginName, GetUserByEmail, GetURLForNewAttachment, BuildFilterForInvoiceID } from '../MyHelperMethods';
import { InvoiceGridDetailComponent } from '../InvoiceGridDetailComponent';
import { MyLists } from '../enums/MyLists';
import { InvoiceActionRequestTypes } from '../enums/MyEnums';
import { FinanceGridEditForm, IGPAttachmentProps } from './FinanceGridEditForm';
import { FileRefCell } from '../FileRefCell';
import { IDCell } from '../IDCell';
import { IMySaveResult, IInvoiceUpdateItem, IInvoiceItem } from '../interface/MyInterfaces';
import { QuickFilterButtonGroup } from '../QuickFilterButtonGroup';
import { INewApproval } from '../RequestApprovalDialogComponent';
import { ApprovalDialogContainer } from '../ApprovalDialogContainer';

interface IFinanceGridState {
  data: IInvoicesDataState;
  receivedData: IInvoiceItem[];
  dataState: any;
  productInEdit: any;
  productInApproval: any;
  statusData: any;
  siteUsersData: any;
  filter: any;
  //sort: any;
  allRowsExpanded: boolean;
  currentUser?: any;
  saveResult: IMySaveResult;
  gpAttachmentProps: IGPAttachmentProps;

  // If Finance needs to send a note.
  newApproval?: INewApproval;
}

interface IInvoicesDataState {
  //TODO: Change Array<any> to Array<IInvoice>
  data: Array<any>;
  total: number;
}

class CustomUrgentCell extends React.Component<any, any> {
  public render() {
    const value = this.props.dataItem[this.props.field];
    return typeof value === "boolean" && (
      <td>
        {value ? `Yes` : `No`}
      </td>
    );
  }
}

const DEFAULT_DATA_STATE = {
  take: 20,
  skip: 0,
  sort: [
    { field: 'ID', dir: 'desc' }
  ],
};

class FinanceGrid extends React.Component<any, IFinanceGridState> {
  constructor(props) {
    super(props);

    let defaultFilters = ConvertQueryParamsToKendoFilter([{ FilterField: 'FILTERFIELD1', FilterValue: 'FILTERVALUE1' }]);

    this.state = {
      data: { data: [], total: 0 },
      // Same as invoices but this object is used to restore data to it's original state.
      receivedData: [],
      dataState: DEFAULT_DATA_STATE,
      productInEdit: undefined,
      productInApproval: undefined,
      statusData: [],
      siteUsersData: [],
      filter: {
        logic: "and",
        filters: defaultFilters
      },
      allRowsExpanded: false,
      gpAttachmentProps: {
        type: null,
        errorMessage: null
      },
      saveResult: {
        success: true,
        message: null
      }
    };

    sp.web.currentUser.get().then(user => {
      this.CommandCell = MyCommandCell({
        edit: this.edit,
        approvalResponse: this.onApprovalResponse,
        remove: null,
        add: null,
        discard: null,
        update: null,
        cancel: this.cancel,
        editField: this._editField,
        currentUser: user
      });
    });
  }

  //#region Variables
  private _editField: string = "inEdit";
  private _columnWidth: string = "150px";
  private _NoSubmittedInvoiceFilter = {
    logic: "and",
    filters: [
      {
        field: "Invoice_x0020_Status",
        operator: "neq",
        value: InvoiceStatus.Submitted
      }
    ]
  };
  //#endregion

  //#region Custom Components

  //this.CommandCell is set in this classes constructor.
  private CommandCell;
  private MyCustomUrgentCell = (props) => <CustomUrgentCell {...props} />;

  public MyCustomCell = (props) => <FileRefCell {...props} />;

  public RowRender(trElement, props) {
    // Set the rows background color to red if status is cancelled. 
    return React.cloneElement(
      trElement,
      props.dataItem.Invoice_x0020_Status === InvoiceStatus.Cancelled ? { style: { backgroundColor: "rgb(243, 23, 0, 0.32)" } } : {},
      trElement.props.children
    );
  }
  //#endregion

  //#region Methods
  /**
   * Filter Invoices by a single click of a button.
   * @param e Button click event
   * @param showTheseInvoices The invoices that we want to display
   */
  public onFilterButtonClick = (e, showTheseInvoices) => {
    this.setState(
      {
        filter: BuildFilterForInvoiceID(showTheseInvoices),
        data: undefined,
        dataState: DEFAULT_DATA_STATE
      },
      () => {
        QueryInvoiceData(
          { filterState: this.state.filter, dataState: this.state.dataState },
          (invoices) => {
            this.setState({ data: process(invoices, this.state.dataState) });
          }
        );
      }
    );
  }

  public dataReceived = (invoices) => {
    var dataHolder: any = filterBy(invoices.data, this.state.filter);

    this.setState({
      ...this.state,
      data: {
        data: dataHolder,
        total: invoices.total
      },
      receivedData: invoices
    });
  }

  public arDataReceived = (invoices) => {
    this.setState({
      data: { ...process(invoices, this.state.dataState) },
      receivedData: invoices
    });
  }

  public statusDataReceived = (status) => {
    // These status should not be visible in the Finance form as per Al Baker. 
    // * See issue https://github.com/Steven-Chorkawy/Submit-AR-Invoice/issues/71
    let hideThese = [
      'Submitted',
      'Approved',
      'Rejected'
    ];

    for (let index = 0; index < hideThese.length; index++) {
      status.splice(status.indexOf(hideThese[index]), 1);
    }

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

  public dataStateChange = e => {
    this.setState({
      ...this.state,
      dataState: e.data
    });
  }

  public expandChange = e => {
    e.dataItem.expanded = !e.dataItem.expanded;
    this.forceUpdate();
  }

  public expandAllRows = () => {
    this.setState({
      allRowsExpanded: !this.state.allRowsExpanded
    });
    // loop over this.state.invoices.data
    this.state.data.data.map(invoice => {
      invoice.expanded = this.state.allRowsExpanded;
      this.expandChange({ dataItem: invoice });
    });
  }
  //#endregion End Methods

  //#region Update Methods
  public removeRelatedAttachments = (element, invoiceId) => {
    let invoiceIndex = this.state.data.data.findIndex(f => f.Id === invoiceId);
    let dataState = this.state.data.data;
    dataState[invoiceIndex].RelatedAttachments = dataState[invoiceIndex].RelatedAttachments.filter(f => { return f.Id !== element.id; });
  }

  public updateRelatedAttachments = (element, invoiceId) => {
    GetURLForNewAttachment(
      element,
      invoiceId,
      this.state.data.data,
      invoices => {
        this.setState({
          data: { data: invoices, total: invoices.length }
        });
      }
    );


    sp.web.lists.getByTitle('RelatedInvoiceAttachments')
      .items
      .filter(`AR_x0020_Invoice_x0020_Request/ID eq ${invoiceId}`)
      .getAll()
      .then(newestMetadata => {
        sp.web.getFolderByServerRelativePath(MyLists["Related Invoice Attachments"])
          .files()
          .then(docFromSP => {
            let thisNewFile = docFromSP.find(f => f.Title === element.name);
            let thisNewFileMetadata = newestMetadata.find(f => f.Title === element.name);

            thisNewFileMetadata.ServerRedirectedEmbedUrl = thisNewFile.ServerRelativeUrl;

            let invoiceIndex = this.state.data.data.findIndex(f => f.Id === invoiceId);
            let dataState = this.state.data.data;
            dataState[invoiceIndex].RelatedAttachments.push(thisNewFileMetadata);

            this.setState({
              data: {
                data: dataState,
                total: dataState.length
              }
            });
          });
      });
  }

  /**
   * Remove a Field/ Property of a given object.
   * @param input Object that contains unwanted fields.
   * @param fields Fields/ Properties that need to be removed
   */
  private removeFields(input: Object, fields: Array<any>) {
    for (let index = 0; index < fields.length; index++) {
      delete input[fields[index]];
    }
    return input;
  }

  public onNoteChange = e => {
    this.setState({
      newApproval: { ...this.state.newApproval, Description: e.target.value }
    });
  }

  public onApproverChange = e => {
    this.setState({
      newApproval: { ...this.state.newApproval, Users: e }
    });
  }

  public onRequestTypeChange = (e, options, index) => {
    this.setState({
      newApproval: { ...this.state.newApproval, RequestType: options.text }
    });
  }
  //#endregion Update Methods

  //#region CRUD Methods
  public itemChange = e => {
    const data = this.state.data.data.map(item =>
      item.ID === e.dataItem.ID ? { ...item, [e.field]: e.value } : item
    );

    this.setState({
      data: {
        ...this.state.data,
        data: data
      }
    });
  }

  /**
   * Open the edit form.
   * @param dataItem Invoice to edit.
   */
  public edit = (dataItem) => {
    this.setState({ productInEdit: Object.assign({}, dataItem) });
  }

  /**
   * When a user clicks Approve/Deny.
   * @param dataItem Item user wants to approve.
   */
  public onApprovalResponse = dataItem => {
    this.setState({
      productInApproval: Object.assign({}, dataItem)
    });
  }

  /**
   * When a user submits an approval response. 
   * @param dataItem Approval Modified.
   */
  public approvalResponseSent = approvalItem => {
    // This is the invoice that we will need to update in state.data.data
    let allInvoices = this.state.data.data;
    const invoiceIndex = allInvoices.findIndex(a => a.ID === this.state.productInApproval.ID);
    let invoice = allInvoices[invoiceIndex];

    // Update the approval action item in the productInApproval state. 
    const approvalActionIndex = invoice.Actions.findIndex(a => a.ID === approvalItem.ID);

    // Store all the approval actions here so we can edit them. 
    let allApprovalActions = invoice.Actions;

    // Update the approval using the index that we previously found. 
    allApprovalActions[approvalActionIndex] = approvalItem;

    invoice.Actions = allApprovalActions;

    allInvoices[invoiceIndex] = { ...invoice };

    this.setState({
      data: {
        data: allInvoices,
        total: allInvoices.length
      },
      productInApproval: undefined
    });
  }

  /**
   * onSubmit
   */
  public handleSubmit = e => {
    // Hold all the invoices, we will use this to update the entire state later. 
    let allInvoices = this.state.data.data;
    // The index of the invoice that is currently in edit.
    const invoiceIndex = allInvoices.findIndex(f => f.ID === this.state.productInEdit.ID);
    const productInEditId = this.state.productInEdit.ID;
    /**
     * When status is equal to 'Accountant Approval Required', 'Hold for Department', or 'Entered into GP'
     * and the event status does not equal the productInEdit status, a user must be selected to create an approval request. 
     * 
     * The reason for 'event.Invoice_x0020_Status !== this.state.productInEdit.Invoice_x0020_Status'
     * is because we only want to validate this logic when the user has changed the Invoice Status.
     * 
     * Here we can validate that a user has been selected by checking the this.state.newApproval.Users property. 
     * If no user is provided, an error message will have already been displayed.
     * All we need to do here is prevent the save event from occurring.
     */
    if (e.Invoice_x0020_Status !== this.state.productInEdit.Invoice_x0020_Status) {
      if (e.Invoice_x0020_Status === InvoiceStatus["Accountant Approval Required"]
        || e.Invoice_x0020_Status === InvoiceStatus["Hold for Department"]
        || e.Invoice_x0020_Status === InvoiceStatus["Entered into GP"]) {
        // Check if the newApproval state has been set.  Without this we won't be able to get the users.
        if (!this.state.newApproval) {
          return; // Return to end the save event function.
        }

        // If the Users property is not set or if it is empty that means no user has been provided. 
        // Ignore this check if status is hold for department because we will get the user from elsewhere.
        if (e.Invoice_x0020_Status !== InvoiceStatus["Hold for Department"]) {
          if (!this.state.newApproval.Users || this.state.newApproval.Users.length === 0) {
            return; // Return to end the save event function.
          }
        }

        let approvalRequestType = undefined;
        // Since there cannot be a change event for the request type dropdown because there is only one option to select I'm setting the values here.
        switch (e.Invoice_x0020_Status) {
          case InvoiceStatus["Accountant Approval Required"]:
            approvalRequestType = InvoiceActionRequestTypes.AccountantApprovalRequired;
            break;
          case InvoiceStatus["Hold for Department"]:
            approvalRequestType = InvoiceActionRequestTypes.EditRequired;
            break;
          case InvoiceStatus["Entered into GP"]:
            approvalRequestType = InvoiceActionRequestTypes.AccountingClerkApprovalRequired;
            break;
          default:
            return; // End save function because something went wrong.
        }

        // Create the approval request. 
        this.state.newApproval.Users.map(user => {
          GetUserByLoginName(user.loginName).then(u => {
            CreateInvoiceAction(u.Id, approvalRequestType, productInEditId, this.state.newApproval.Description).then(actionRes => {
              // Add the new action to the list of existing actions.
              allInvoices[invoiceIndex].Actions = [...allInvoices[invoiceIndex].Actions, actionRes];
              this.setState({
                data: {
                  data: [...allInvoices],
                  total: allInvoices.length
                }
              });
            });
          });
        });
      }
    }
    // End approval request validation. 

    // TODO: Get accounting clerk and or accountants approval here. 
    let updateProperties = {
      Invoice_x0020_Status: e.Invoice_x0020_Status,
      Invoice_x0020_Number: e.Invoice_x0020_Number,
      Batch_x0020_Number: e.Batch_x0020_Number
    };

    sp.web.lists.getByTitle(MyLists["AR Invoice Requests"]).items.getById(productInEditId).update(updateProperties).then(value => {
      allInvoices[invoiceIndex] = { ...allInvoices[invoiceIndex], ...updateProperties };
      // If all goes well we can remove the product in edit. 
      this.setState({
        data: {
          data: [...allInvoices],
          total: allInvoices.length
        },
        productInEdit: undefined
      });
    }).catch(reason => {
      alert('Something went wrong!  Could not save.');
    });
  }

  /**
   * Cancel and discard all changes made to the current edit.
   * @param dataItem Invoice item that we are no longer editing.
   */
  public cancel = (dataItem) => {
    const originalItem = this.state.receivedData.find(p => p.ID === dataItem.ID);
    const data = this.state.data.data.map(item => item.ID === originalItem.ID ? originalItem : item);
    this.setState({
      data: {
        ...this.state.data,
        data: data
      },
      productInEdit: undefined,
    });
  }

  // Close the approval dialog container. 
  public cancelApproval = () => { this.setState({ productInApproval: undefined }); };

  public cancelEditForm = () => {
    this.setState({ productInEdit: undefined });
  }

  /**
   * Cancel all changes made.
   */
  public cancelCurrentChanges = () => {
    // reset everything back.
    this.setState({
      data: { ...process(this.state.receivedData, this.state.dataState) }
    });
  }
  //#endregion end CRUD Methods

  public render() {
    const hasEditedItem = this.state.data ? this.state.data.data.some(p => p.inEdit) : false;
    return (
      <div>
        <Grid
          filterable={false}
          sortable={true}
          pageable={{ buttonCount: 4, pageSizes: true, info: true }}
          resizable={true}
          {...this.state.dataState}
          {...this.state.data}
          onDataStateChange={this.dataStateChange}
          onItemChange={this.itemChange}
          editField={this._editField}
          filter={this.state.filter}
          detail={InvoiceGridDetailComponent}
          expandField="expanded"
          onExpandChange={this.expandChange}
          rowRender={this.RowRender}
          style={{ minHeight: '520px', maxHeight: '700px' }}
        >
          <GridToolbar>
            <Button title="Expand All Rows"
              className="k-button"
              icon="plus"
              onClick={this.expandAllRows}>Toggle All Rows</Button>
            <QuickFilterButtonGroup invoices={this.state.receivedData} onButtonClick={this.onFilterButtonClick} />
            {hasEditedItem && (
              <Button
                title="Cancel current changes"
                className="k-button"
                icon="cancel"
                onClick={this.cancelCurrentChanges}
              >Cancel Current Changes</Button>
            )}
          </GridToolbar>
          <GridColumn field="ID" title="ID" width={this._columnWidth} editable={false} cell={(props) => <IDCell {...props} />} />
          <GridColumn field="Date" title="Date" width={this._columnWidth} filter='date' format={MyGridStrings.DateFilter} />
          <GridColumn field="Department" title="Department" width={this._columnWidth} />
          <GridColumn field="Customer.Customer_x0020_Name" title="Customer" width={this._columnWidth} />
          <GridColumn field="Invoice_x0020_Status" title="Status" width={this._columnWidth} />
          <GridColumn field="Invoice_x0020_Number" title="Invoice #" width={this._columnWidth} />
          <GridColumn field="Batch_x0020_Number" title="Batch #" width={this._columnWidth} />
          <GridColumn field="Urgent" title="Urgent" width={this._columnWidth} cell={this.MyCustomUrgentCell} />

          <GridColumn cell={this.CommandCell} width={"120px"} locked={true} resizable={false} filterable={false} sortable={false} />
        </Grid>
        {
          this.state.productInEdit &&
          <FinanceGridEditForm
            currentUser={this.state.currentUser}
            dataItem={this.state.productInEdit}
            statusData={this.state.statusData}
            siteUsersData={this.state.siteUsersData}
            onSubmit={this.handleSubmit}
            onNoteChange={this.onNoteChange}
            onApproverChange={this.onApproverChange}
            saveResult={this.state.saveResult}
            cancel={this.cancelEditForm}
            updateAccountDetails={(e) => {
              // e will be a list of all the accounts.              
              let invoiceIndex = this.state.data.data.findIndex(f => f.Id === this.state.productInEdit.ID);
              let dataState = this.state.data.data;
              dataState[invoiceIndex].AccountDetails = [...e];
              this.setState({
                data: {
                  data: dataState,
                  total: dataState.length
                },
                productInEdit: { ...this.state.productInEdit, AccountDetails: [...e] }
              });
            }}
            onRelatedAttachmentAdd={this.updateRelatedAttachments}
            onRelatedAttachmentRemove={this.removeRelatedAttachments}
            GPAttachmentWidgetProps={this.state.gpAttachmentProps}
            context={this.props.context}
          />
        }

        {
          this.state.productInApproval &&
          <ApprovalDialogContainer
            context={this.props.context}
            dataItem={this.state.productInApproval}
            currentUser={this.state.currentUser}
            updateAccountDetails={e => {
              // e will be a list of all the accounts.              
              let invoiceIndex = this.state.data.data.findIndex(f => f.Id === this.state.productInApproval.ID);
              let dataState = this.state.data.data;
              dataState[invoiceIndex].AccountDetails = [...e];
              this.setState({
                data: {
                  data: dataState,
                  total: dataState.length
                },
                productInApproval: { ...this.state.productInApproval, AccountDetails: [...e] }
              });
            }}
            onResponseSent={this.approvalResponseSent}
            onRelatedAttachmentAdd={this.updateRelatedAttachments}
            onRelatedAttachmentRemove={this.removeRelatedAttachments}
            cancel={this.cancelApproval}
          />
        }

        <InvoiceDataProvider
          dataState={this.state.dataState}
          filterState={this._NoSubmittedInvoiceFilter}

          onARRequestDataReceived={this.arDataReceived}
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

export { FinanceGrid };
